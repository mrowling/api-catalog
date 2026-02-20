export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType = 'text' | 'status' | 'question' | 'diff' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: Date;
  // For status messages (updates in place)
  isLiveUpdate?: boolean;
  // For question messages
  question?: {
    id: string;
    text: string;
    options: string[]; // Backend sends string array like "[✓] pagination: ..."
  };
  // For diff messages
  diff?: {
    before?: string;
    after?: string;
    preview: string;
    added: string[];
    removed: string[];
    modified: string[];
  };
}

// Backend SSE event types (matching apps/api/src/services/agentic-generation.ts)
export interface StreamEvent {
  type: 'conversation' | 'status' | 'question' | 'result' | 'diff' | 'error';
  // Conversation event
  conversationId?: string;
  // Status event
  status?: 'analyzing' | 'generating' | 'validating' | 'improving' | 'complete';
  message?: string;
  // Question event
  question?: {
    id: string;
    text: string;
    options: string[];
    default?: string;
  };
  // Result event
  spec?: string;
  // Diff event
  diff?: {
    added: string[];
    removed: string[];
    modified: string[];
    preview: string;
  };
  // Error event
  error?: string;
  validationErrors?: Array<{
    message: string;
    line?: number;
    column?: number;
    path?: string[];
  }>;
}

export interface GenerationResult {
  spec: string;
  template?: string;
}
