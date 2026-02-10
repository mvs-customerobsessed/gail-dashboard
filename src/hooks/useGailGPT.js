import { useState, useCallback, useRef } from 'react';
import { sendMessage, parseSSEStream, uploadFile } from '../services/gailgptService';
import { supabase } from '../lib/supabase';

export function useGailGPT(conversationId) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentThinking, setCurrentThinking] = useState('');
  const [currentToolCalls, setCurrentToolCalls] = useState([]);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [error, setError] = useState(null);
  const [isThinkingComplete, setIsThinkingComplete] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const abortControllerRef = useRef(null);

  const send = useCallback(async (content, files = [], overrideConversationId = null) => {
    // Force refresh the session to ensure we have a valid access token
    console.log('GailGPT: Refreshing session...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    console.log('GailGPT: Refresh result:', {
      hasSession: !!refreshData?.session,
      error: refreshError?.message,
      errorCode: refreshError?.code,
    });

    let session = refreshData?.session;

    // If refresh fails, try getting the current session as fallback
    if (refreshError || !session) {
      console.log('GailGPT: Refresh failed, trying getSession...');
      const { data: sessionData, error: getError } = await supabase.auth.getSession();
      console.log('GailGPT: getSession result:', {
        hasSession: !!sessionData?.session,
        error: getError?.message,
      });
      session = sessionData?.session;
    }

    if (!session?.access_token) {
      console.error('GailGPT: No valid session available');
      setError('Session expired. Please sign out and sign in again.');
      return;
    }

    const accessToken = session.access_token;
    const userId = session.user.id;

    // Decode JWT to check expiry
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      console.log('GailGPT: Token details:', {
        tokenPrefix: accessToken.substring(0, 40) + '...',
        expiresAt: expiresAt.toISOString(),
        isExpired: now > expiresAt,
        timeLeft: Math.round((expiresAt - now) / 1000) + 's',
        sub: payload.sub,
        aud: payload.aud,
        iss: payload.iss,
      });
    } catch (e) {
      console.log('GailGPT: Could not decode token');
    }

    // Use override if provided (for newly created conversations)
    const effectiveConversationId = overrideConversationId ?? conversationId;
    console.log('GailGPT: Sending message', { content, hasFiles: files.length > 0, conversationId: effectiveConversationId });

    setIsStreaming(true);
    setError(null);
    setCurrentThinking('');
    setCurrentToolCalls([]);
    setCurrentArtifact(null);
    setIsThinkingComplete(false);

    // Upload files to Supabase Storage and collect file_ids
    const uploadedFiles = [];
    if (files.length > 0) {
      console.log('GailGPT: Uploading', files.length, 'files...');
      for (const file of files) {
        try {
          const fileRecord = await uploadFile(file, userId, effectiveConversationId);
          uploadedFiles.push(fileRecord);
          console.log('GailGPT: Uploaded file', fileRecord.filename, 'with id', fileRecord.id);
        } catch (uploadError) {
          console.error('GailGPT: Failed to upload file', file.name, uploadError);
          const errorMsg = uploadError?.message || uploadError?.error_description || JSON.stringify(uploadError);
          setError(`Failed to upload file "${file.name}": ${errorMsg}`);
          setIsStreaming(false);
          return;
        }
      }
    }

    // Add user message (with deduplication check to prevent race conditions)
    const userMessage = {
      role: 'user',
      content,
      files: files.map(f => f.name),
      fileIds: uploadedFiles.map(f => f.id), // Store file IDs for reference
    };

    // Prepare assistant message placeholder
    const assistantMessage = {
      role: 'assistant',
      content: '',
      thinking: '',
      toolCalls: [],
      artifacts: [],
    };

    // Add both messages atomically, checking for duplicates
    setMessages(prev => {
      // Check if user message with same content was already added (prevents duplicates from race conditions)
      const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
      if (lastUserMsg && lastUserMsg.content === content) {
        // User message already exists, just add assistant placeholder
        return [...prev, assistantMessage];
      }
      return [...prev, userMessage, assistantMessage];
    });

    try {
      abortControllerRef.current = new AbortController();

      // Build messages for API (only role and content)
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Collect file_ids from uploaded files
      const fileIds = uploadedFiles.map(f => f.id);

      console.log('GailGPT: Calling Edge Function...', { fileIds });
      const response = await sendMessage(
        apiMessages,
        effectiveConversationId,
        accessToken,
        abortControllerRef.current.signal,
        fileIds
      );
      console.log('GailGPT: Edge Function responded', { status: response.status });

      let thinkingBuffer = '';
      let textBuffer = '';
      let delayedTextBuffer = '';
      let thinkingOccurred = false;
      let thinkingCompleted = false;
      const toolCallsBuffer = [];

      // Helper to flush buffered text to the message
      const flushTextBuffer = () => {
        if (delayedTextBuffer) {
          textBuffer += delayedTextBuffer;
          delayedTextBuffer = '';
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              last.content = textBuffer;
            }
            return updated;
          });
        }
      };

      await parseSSEStream(response, {
        onThinkingStart: () => {
          thinkingBuffer = '';
          thinkingOccurred = true;
          thinkingCompleted = false;
          setCurrentThinking('');
          setIsThinkingComplete(false);
        },

        onThinkingDelta: (text) => {
          thinkingBuffer += text;
          setCurrentThinking(thinkingBuffer);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              last.thinking = thinkingBuffer;
            }
            return updated;
          });
        },

        onThinkingEnd: () => {
          thinkingCompleted = true;
          setIsThinkingComplete(true);
          // Flush any buffered text now that thinking is complete
          flushTextBuffer();
        },

        onTextDelta: (text) => {
          // Buffer text if thinking occurred but hasn't completed yet
          if (thinkingOccurred && !thinkingCompleted) {
            delayedTextBuffer += text;
          } else {
            // Stream text normally
            textBuffer += text;
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                last.content = textBuffer;
              }
              return updated;
            });
          }
        },

        onToolStart: (tool) => {
          const toolCall = { ...tool, status: 'in_progress', steps: [] };
          toolCallsBuffer.push(toolCall);
          setCurrentToolCalls([...toolCallsBuffer]);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              last.toolCalls = [...toolCallsBuffer];
            }
            return updated;
          });
        },

        onToolComplete: (toolId, result) => {
          const toolIndex = toolCallsBuffer.findIndex(t => t.id === toolId);
          if (toolIndex !== -1) {
            toolCallsBuffer[toolIndex] = {
              ...toolCallsBuffer[toolIndex],
              status: 'complete',
              result,
            };
            setCurrentToolCalls([...toolCallsBuffer]);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                last.toolCalls = [...toolCallsBuffer];
              }
              return updated;
            });
          }
        },

        onToolProgress: (toolId, step, progress) => {
          const toolIndex = toolCallsBuffer.findIndex(t => t.id === toolId);
          if (toolIndex !== -1) {
            toolCallsBuffer[toolIndex] = {
              ...toolCallsBuffer[toolIndex],
              progressStep: step,
              progress: progress,
            };
            setCurrentToolCalls([...toolCallsBuffer]);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                last.toolCalls = [...toolCallsBuffer];
              }
              return updated;
            });
          }
        },

        // Initialize steps for a tool (step-based execution)
        onStepsInit: (toolId, steps) => {
          const toolIndex = toolCallsBuffer.findIndex(t => t.id === toolId);
          if (toolIndex !== -1) {
            toolCallsBuffer[toolIndex] = {
              ...toolCallsBuffer[toolIndex],
              steps: steps,
              hasSteps: true,
            };
            setCurrentToolCalls([...toolCallsBuffer]);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                last.toolCalls = [...toolCallsBuffer];
              }
              return updated;
            });
          }
        },

        // Update individual step status
        onStepUpdate: (toolId, stepUpdate) => {
          const toolIndex = toolCallsBuffer.findIndex(t => t.id === toolId);
          if (toolIndex !== -1) {
            const tool = toolCallsBuffer[toolIndex];
            const steps = tool.steps || [];
            const stepIndex = steps.findIndex(s => s.id === stepUpdate.stepId);

            if (stepIndex !== -1) {
              // Update existing step
              steps[stepIndex] = {
                ...steps[stepIndex],
                status: stepUpdate.status,
                displayValue: stepUpdate.displayValue || steps[stepIndex].displayValue,
                error: stepUpdate.error,
              };
            }

            // Update the running step label for the summary
            const runningStep = steps.find(s => s.status === 'running');

            toolCallsBuffer[toolIndex] = {
              ...tool,
              steps: [...steps],
              progressStep: runningStep?.label || tool.progressStep,
            };

            setCurrentToolCalls([...toolCallsBuffer]);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                last.toolCalls = [...toolCallsBuffer];
              }
              return updated;
            });
          }
        },

        // Handle form required for missing fields
        onFormRequired: (toolId, formSchema) => {
          console.log('📋 useGailGPT onFormRequired:', { toolId, formSchema });
          const toolIndex = toolCallsBuffer.findIndex(t => t.id === toolId);
          console.log('📋 Tool index found:', toolIndex, 'Buffer:', toolCallsBuffer);
          if (toolIndex !== -1) {
            toolCallsBuffer[toolIndex] = {
              ...toolCallsBuffer[toolIndex],
              formSchema: formSchema,
              awaitingFormInput: true,
            };
            console.log('📋 Updated tool call:', toolCallsBuffer[toolIndex]);
            setCurrentToolCalls([...toolCallsBuffer]);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                last.toolCalls = [...toolCallsBuffer];
              }
              return updated;
            });
          }
        },

        onArtifact: (artifact) => {
          setCurrentArtifact(artifact);
          setArtifacts(prev => [...prev, artifact]);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              last.artifacts = [...(last.artifacts || []), artifact];
            }
            return updated;
          });
        },

        onDone: () => {
          setIsStreaming(false);
          setCurrentThinking('');
          setCurrentToolCalls([]);
        },

        onError: (err) => {
          setError(err.message);
          setIsStreaming(false);
        },
      });
    } catch (err) {
      console.error('GailGPT: Error sending message', err);
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred while sending the message');
      }
      setIsStreaming(false);
    }
  }, [messages, conversationId]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setCurrentThinking('');
    setCurrentToolCalls([]);
    setCurrentArtifact(null);
    setArtifacts([]);
    setError(null);
  }, []);

  // Submit form data for missing fields (resumes COI generation)
  const submitFormData = useCallback(async (toolId, formData, overrideConversationId = null) => {
    setIsFormSubmitting(true);

    // Build the certificate holder object from form data
    const certificateHolder = {
      name: formData.cert_holder_name || '',
      address: formData.cert_holder_address || '',
    };

    // Include additional insured info if checked
    if (formData.is_additional_insured) {
      certificateHolder.is_additional_insured = true;
      certificateHolder.additional_insured_type = formData.additional_insured_type || 'ongoing';
    }

    // Build the message content that provides the missing info naturally
    let messageContent = `Certificate holder: ${certificateHolder.name}\nAddress: ${certificateHolder.address}`;

    if (formData.is_additional_insured) {
      messageContent += `\n\nPlease add them as an additional insured (${formData.additional_insured_type || 'ongoing operations'}).`;
    }

    if (formData.description_of_operations) {
      messageContent += `\n\nDescription of operations: ${formData.description_of_operations}`;
    }

    try {
      await send(messageContent, [], overrideConversationId);
    } finally {
      setIsFormSubmitting(false);
    }
  }, [send]);

  return {
    messages,
    isStreaming,
    currentThinking,
    currentToolCalls,
    currentArtifact,
    artifacts,
    error,
    isThinkingComplete,
    isFormSubmitting,
    send,
    stop,
    clear,
    setMessages,
    submitFormData,
  };
}
