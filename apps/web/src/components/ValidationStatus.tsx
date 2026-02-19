import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import type { ValidationResponse } from '../generated/api/types.gen';

interface ValidationStatusProps {
  validation: ValidationResponse | null;
  isGenerating: boolean;
}

export function ValidationStatus({ validation, isGenerating }: ValidationStatusProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 350px below but more space above, show tooltip above
      if (spaceBelow < 350 && spaceAbove > spaceBelow) {
        setTooltipPosition('top');
      } else {
        setTooltipPosition('bottom');
      }
    }
  }, [isHovered]);

  if (isGenerating) {
    return (
      <div className="validation-status generating">
        <Loader2 className="spinner" size={18} />
        <span>Generating...</span>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="validation-status idle">
        <span>No spec loaded</span>
      </div>
    );
  }

  if (validation.valid) {
    return (
      <div className="validation-status valid">
        <CheckCircle size={18} />
        <span>
          Valid {validation.version && `• ${validation.version}`}
        </span>
      </div>
    );
  }

  const errorCount = validation.errors.length;
  
  return (
    <div 
      ref={containerRef}
      className="validation-status invalid"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <XCircle size={18} />
      <span>
        {errorCount} error{errorCount !== 1 ? 's' : ''}
      </span>
      
      {isHovered && (
        <div className={`validation-tooltip ${tooltipPosition}`}>
          <div className="validation-tooltip-header">
            Validation Errors ({errorCount})
          </div>
          <div className="validation-tooltip-content">
            {validation.errors.map((error, index) => (
              <div key={index} className="validation-error-item">
                <span className="error-bullet">•</span>
                <span className="error-message">{error.message}</span>
                {error.path && error.path.length > 0 && (
                  <span className="error-path">at {error.path.join('.')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
