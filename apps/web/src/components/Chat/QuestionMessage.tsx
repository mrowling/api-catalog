import { HelpCircle } from 'lucide-react';
import './ChatMessage.css';

interface QuestionMessageProps {
  content: string;
  question: {
    id: string;
    text: string;
    options: string[]; // Backend sends string array like "[✓] pagination: ..."
  };
  onAnswer: (answer: string) => void;
}

export function QuestionMessage({ question, onAnswer }: QuestionMessageProps) {
  return (
    <div className="chat-message assistant question">
      <div className="message-content">
        <div className="question-header">
          <HelpCircle size={18} />
          <span>{question.text}</span>
        </div>
        <div className="question-options">
          {question.options.map((option, index) => (
            <button
              key={`${question.id}-option-${index}`}
              className="question-option"
              onClick={() => onAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
