import { supabase } from '../lib/supabase';

// Get the Supabase Edge Function URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const GAILGPT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gailgpt-chat`;

/**
 * Send a message to the GailGPT chat endpoint
 * Returns a ReadableStream for SSE events
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} conversationId - The conversation ID
 * @param {string} accessToken - The user's access token
 * @param {AbortSignal} signal - Optional abort signal
 * @param {Array} fileIds - Optional array of uploaded file IDs for tool access
 */
export async function sendMessage(messages, conversationId, accessToken, signal, fileIds = []) {
  console.log('GailGPT Service: Sending to', GAILGPT_FUNCTION_URL);
  console.log('GailGPT Service: Token prefix:', accessToken?.substring(0, 20) + '...');
  if (fileIds.length > 0) {
    console.log('GailGPT Service: Including file_ids:', fileIds);
  }

  // Get the anon key for Edge Function authentication
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(GAILGPT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        conversationId,
        file_ids: fileIds, // Pass uploaded file IDs for tool access
      }),
      signal,
    });

    console.log('GailGPT Service: Response status', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GailGPT Service: Error response', errorText);
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.error('GailGPT Service: Network error - Edge Function may not be deployed');
      throw new Error('Unable to connect to GailGPT. The Edge Function may not be deployed. Check the browser console for details.');
    }
    throw err;
  }
}

/**
 * Parse SSE stream from the response
 */
export async function parseSSEStream(response, callbacks) {
  const {
    onThinkingStart,
    onThinkingDelta,
    onThinkingEnd,
    onTextDelta,
    onToolStart,
    onToolInputDelta,
    onToolComplete,
    onToolProgress,
    onArtifact,
    onDone,
    onError,
  } = callbacks;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Track thinking state to detect when thinking ends
  let hadThinking = false;
  let thinkingEnded = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete events in the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            onDone?.();
            continue;
          }

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'thinking_start':
                hadThinking = true;
                thinkingEnded = false;
                onThinkingStart?.();
                break;

              case 'thinking_delta':
                onThinkingDelta?.(event.text);
                break;

              case 'text_delta':
                // Detect thinking end: first text_delta after thinking means thinking is complete
                if (hadThinking && !thinkingEnded) {
                  thinkingEnded = true;
                  onThinkingEnd?.();
                }
                onTextDelta?.(event.text);
                break;

              case 'tool_start':
                // Detect thinking end: first tool_start after thinking means thinking is complete
                if (hadThinking && !thinkingEnded) {
                  thinkingEnded = true;
                  onThinkingEnd?.();
                }
                onToolStart?.({
                  id: event.id,
                  name: event.tool,
                  status: 'pending',
                });
                break;

              case 'tool_input_delta':
                onToolInputDelta?.(event.json);
                break;

              case 'tool_complete':
                onToolComplete?.(event.id, event.result);
                break;

              case 'tool_progress':
                onToolProgress?.(event.id, event.step, event.progress);
                break;

              case 'artifact':
                onArtifact?.(event.artifact);
                break;

              case 'error':
                onError?.(new Error(event.message));
                break;

              case 'done':
                onDone?.();
                break;

              default:
                console.log('Unknown event type:', event.type);
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e, data);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      if (data && data !== '[DONE]') {
        try {
          const event = JSON.parse(data);
          if (event.type === 'done') {
            onDone?.();
          }
        } catch (e) {
          // Ignore incomplete data
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled
      return;
    }
    onError?.(error);
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(file, userId, conversationId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${userId}/${conversationId || 'temp'}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('gailgpt-files')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  // Save file metadata to database
  // Note: conversation_id can be null for files uploaded before a conversation is created
  const insertData = {
    user_id: userId,
    filename: file.name,
    content_type: file.type,
    storage_path: filePath,
    file_size: file.size,
  };
  // Only include conversation_id if it's not null (to avoid DB constraint issues)
  if (conversationId) {
    insertData.conversation_id = conversationId;
  }

  const { data: fileRecord, error: dbError } = await supabase
    .from('gailgpt_files')
    .insert(insertData)
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from('gailgpt-files').remove([filePath]);
    throw dbError;
  }

  return fileRecord;
}

/**
 * Get a signed URL for a file
 */
export async function getFileUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('gailgpt-files')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(fileId, storagePath) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('gailgpt-files')
    .remove([storagePath]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('gailgpt_files')
    .delete()
    .eq('id', fileId);

  if (dbError) {
    throw dbError;
  }
}
