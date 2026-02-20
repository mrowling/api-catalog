import type { StreamEvent } from './types';

export interface StreamingOptions {
  description: string;
  mode: 'create' | 'modify';
  existingSpec?: string;
  conversationId?: string;
  templateName?: string;
  userPreferences?: {
    includePagination?: boolean;
    includeAuth?: boolean;
    authType?: 'bearer' | 'apiKey' | 'oauth2';
    includeErrorHandling?: boolean;
  };
  onEvent: (event: StreamEvent) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
  signal?: AbortSignal;
}

/**
 * Connect to the streaming generation endpoint via Server-Sent Events (SSE)
 */
export async function streamGeneration(options: StreamingOptions): Promise<void> {
  const { 
    description, 
    mode, 
    existingSpec, 
    conversationId,
    templateName,
    userPreferences,
    onEvent, 
    onError, 
    onComplete, 
    signal 
  } = options;

  try {
    const response = await fetch('http://localhost:3001/api/generate/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        mode,
        existingSpec,
        conversationId,
        templateName,
        userPreferences,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Read the SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete messages (separated by \n\n)
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (!message.trim()) continue;

        // Parse SSE format: "data: {...}"
        const lines = message.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6); // Remove "data: " prefix
            
            try {
              const event = JSON.parse(data) as StreamEvent;
              onEvent(event);
            } catch (err) {
              console.error('Failed to parse SSE event:', data, err);
            }
          }
        }
      }
    }

    onComplete();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        // Stream was cancelled - don't call onError
        return;
      }
      onError(err);
    } else {
      onError(new Error('Unknown error occurred'));
    }
  }
}
