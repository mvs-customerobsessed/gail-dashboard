import { useState, useCallback, useRef } from 'react';
import { useAuthContext } from '../components/auth/AuthProvider';
import { sendMessage, parseSSEStream } from '../services/gailgptService';

export function useGailGPT(conversationId) {
  const { session } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentThinking, setCurrentThinking] = useState('');
  const [currentToolCalls, setCurrentToolCalls] = useState([]);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [error, setError] = useState(null);
  const [isThinkingComplete, setIsThinkingComplete] = useState(false);
  const abortControllerRef = useRef(null);

  const send = useCallback(async (content, files = [], overrideConversationId = null) => {
    if (!session?.access_token) {
      console.error('GailGPT: No access token available', { session });
      setError('Not authenticated. Please refresh the page and try again.');
      return;
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

    // Add user message (with deduplication check to prevent race conditions)
    const userMessage = {
      role: 'user',
      content,
      files: files.map(f => f.name),
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

      console.log('GailGPT: Calling Edge Function...');
      const response = await sendMessage(
        apiMessages,
        effectiveConversationId,
        session.access_token,
        abortControllerRef.current.signal
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
          const toolCall = { ...tool, status: 'in_progress' };
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
  }, [messages, conversationId, session]);

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

  return {
    messages,
    isStreaming,
    currentThinking,
    currentToolCalls,
    currentArtifact,
    artifacts,
    error,
    isThinkingComplete,
    send,
    stop,
    clear,
    setMessages,
  };
}
