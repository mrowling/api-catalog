import { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';
import { StatusMessage } from './StatusMessage';
import { QuestionMessage } from './QuestionMessage';
import { DiffMessage } from './DiffMessage';
import { User, Bot, AlertCircle } from 'lucide-react';
import './ChatMessage.css';

interface MessageListProps {
  messages: ChatMessage[];
  onAnswer?: (messageId: string, answer: string) => void;
  onDiffApprove?: (messageId: string) => void;
  onDiffCancel?: (messageId: string) => void;
  onDiffRefine?: (messageId: string) => void;
}

export function MessageList({ 
  messages, 
  onAnswer, 
  onDiffApprove, 
  onDiffCancel, 
  onDiffRefine 
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((message) => {
        // Special message types
        if (message.type === 'status') {
          return <StatusMessage key={message.id} content={message.content} />;
        }

        if (message.type === 'question' && message.question) {
          return (
            <QuestionMessage
              key={message.id}
              content={message.content}
              question={message.question}
              onAnswer={(answer) => onAnswer?.(message.id, answer)}
            />
          );
        }

        if (message.type === 'diff' && message.diff) {
          return (
            <DiffMessage
              key={message.id}
              content={message.content}
              diff={message.diff}
              onApprove={() => onDiffApprove?.(message.id)}
              onCancel={() => onDiffCancel?.(message.id)}
              onRefine={() => onDiffRefine?.(message.id)}
            />
          );
        }

        // Regular text messages
        return (
          <div 
            key={message.id} 
            className={`chat-message ${message.role} ${message.type === 'error' ? 'error' : ''}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? (
                <User size={20} />
              ) : message.type === 'error' ? (
                <AlertCircle size={20} />
              ) : (
                <Bot size={20} />
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
