import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { streamGeneration } from './streaming';
import type { ChatMessage, StreamEvent } from './types';
import './ChatPanel.css';

interface ChatPanelProps {
  currentSpec?: string;
  onSpecUpdate: (spec: string) => void;
  mode: 'create' | 'modify';
}

export function ChatPanel({ currentSpec, onSpecUpdate, mode }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const liveStatusMessageIdRef = useRef<string | null>(null);

  // Add a message to the chat
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  // Update the live status message (replaces previous status)
  const updateStatusMessage = useCallback((content: string) => {
    setMessages((prev) => {
      // Remove previous status message if exists
      const filtered = liveStatusMessageIdRef.current
        ? prev.filter((m) => m.id !== liveStatusMessageIdRef.current)
        : prev;

      const newMessage: ChatMessage = {
        id: `status-${Date.now()}`,
        role: 'assistant',
        type: 'status',
        content,
        timestamp: new Date(),
        isLiveUpdate: true,
      };

      liveStatusMessageIdRef.current = newMessage.id;
      return [...filtered, newMessage];
    });
  }, []);

  // Remove the live status message
  const clearStatusMessage = useCallback(() => {
    if (liveStatusMessageIdRef.current) {
      setMessages((prev) => prev.filter((m) => m.id !== liveStatusMessageIdRef.current));
      liveStatusMessageIdRef.current = null;
    }
  }, []);

  // Handle streaming events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'conversation': {
        // Track conversation ID for reconnection
        if (event.conversationId) {
          setConversationId(event.conversationId);
          console.log('Conversation started:', event.conversationId);
        }
        break;
      }

      case 'status': {
        const statusText = event.message || event.status || 'Processing...';
        updateStatusMessage(statusText);
        break;
      }

      case 'question': {
        clearStatusMessage();
        if (event.question) {
          addMessage({
            role: 'assistant',
            type: 'question',
            content: event.question.text,
            question: {
              id: event.question.id,
              text: event.question.text,
              options: event.question.options,
            },
          });
        }
        break;
      }

      case 'diff': {
        clearStatusMessage();
        if (event.diff) {
          addMessage({
            role: 'assistant',
            type: 'diff',
            content: event.message || 'Review the proposed changes:',
            diff: {
              preview: event.diff.preview,
              added: event.diff.added,
              removed: event.diff.removed,
              modified: event.diff.modified,
            },
          });
        }
        break;
      }

      case 'result': {
        clearStatusMessage();

        // Show success message
        addMessage({
          role: 'assistant',
          type: 'text',
          content: event.message || 'Generated spec successfully!',
        });

        // Update the spec in the editor
        if (event.spec) {
          onSpecUpdate(event.spec);
        }
        break;
      }

      case 'error': {
        clearStatusMessage();
        
        // Format error message with validation errors if available
        let errorContent = `Error: ${event.error || event.message || 'Unknown error occurred'}`;
        
        if (event.validationErrors && event.validationErrors.length > 0) {
          errorContent += '\n\nValidation errors:\n';
          errorContent += event.validationErrors.map((ve, i) => {
            const location = ve.line ? ` (line ${ve.line}${ve.column ? `:${ve.column}` : ''})` : '';
            return `${i + 1}. ${ve.message}${location}`;
          }).join('\n');
        }
        
        addMessage({
          role: 'assistant',
          type: 'error',
          content: errorContent,
        });
        break;
      }
    }
  }, [addMessage, updateStatusMessage, clearStatusMessage, onSpecUpdate, setConversationId]);

  // Handle user sending a message
  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message
    addMessage({
      role: 'user',
      type: 'text',
      content: message,
    });

    // Start generation
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    await streamGeneration({
      description: message,
      mode,
      existingSpec: mode === 'modify' ? currentSpec : undefined,
      conversationId, // Pass conversationId for reconnection
      onEvent: handleStreamEvent,
      onError: (error) => {
        clearStatusMessage();
        addMessage({
          role: 'assistant',
          type: 'error',
          content: `Failed to generate spec: ${error.message}`,
        });
        setIsGenerating(false);
      },
      onComplete: () => {
        clearStatusMessage();
        setIsGenerating(false);
      },
      signal: abortControllerRef.current.signal,
    });
  }, [mode, currentSpec, conversationId, addMessage, handleStreamEvent, clearStatusMessage]);

  // Handle answering questions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAnswer = useCallback((_messageId: string, answer: string) => {
    // Add user's answer as a message
    addMessage({
      role: 'user',
      type: 'text',
      content: answer,
    });

    // TODO: Send answer back to the server to continue generation
    // This requires extending the streaming API to handle mid-generation answers
    console.log('Answer:', answer);
  }, [addMessage]);

  // Handle diff actions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDiffApprove = useCallback((_messageId: string) => {
    addMessage({
      role: 'user',
      type: 'text',
      content: 'Approved changes',
    });
    // Changes already applied via onSpecUpdate in the result event
  }, [addMessage]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDiffCancel = useCallback((_messageId: string) => {
    addMessage({
      role: 'user',
      type: 'text',
      content: 'Cancelled changes',
    });
  }, [addMessage]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDiffRefine = useCallback((_messageId: string) => {
    addMessage({
      role: 'user',
      type: 'text',
      content: 'Requested refinement',
    });
    // TODO: Trigger refinement in the generation service
  }, [addMessage]);

  // Show welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        content: mode === 'create'
          ? 'Describe the API you want to create, and I\'ll generate an OpenAPI specification for you.'
          : 'What changes would you like to make to your OpenAPI specification?',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [mode]); // Only depend on mode

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <MessageSquare size={20} />
        <h2>AI Assistant</h2>
      </div>

      <MessageList
        messages={messages}
        onAnswer={handleAnswer}
        onDiffApprove={handleDiffApprove}
        onDiffCancel={handleDiffCancel}
        onDiffRefine={handleDiffRefine}
      />

      <InputBar
        onSend={handleSendMessage}
        disabled={isGenerating}
        placeholder={
          isGenerating
            ? 'Generating...'
            : mode === 'create'
            ? 'Describe your API...'
            : 'Request modifications...'
        }
      />
    </div>
  );
}
