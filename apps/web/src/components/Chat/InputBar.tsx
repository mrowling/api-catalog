import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import './ChatMessage.css';

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSend, disabled = false, placeholder = 'Describe your API or request modifications...' }: InputBarProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="input-bar">
      <textarea
        ref={textareaRef}
        className="input-textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <button
        className="send-button"
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        aria-label="Send message"
      >
        <Send size={20} />
      </button>
    </div>
  );
}
