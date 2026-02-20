import type { ChatMessage } from './types';
import './ChatMessage.css';

interface QualityMessageProps {
  message: ChatMessage;
}

export function QualityMessage({ message }: QualityMessageProps) {
  if (!message.quality) return null;

  const { score, details } = message.quality;
  
  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const scoreColor = getScoreColor(score);
  
  // Extract quality details if available
  const completeness = details?.completeness as number | undefined;
  const structure = details?.structure as number | undefined;
  const standards = details?.standards as number | undefined;
  const bestPractices = details?.bestPractices as number | undefined;

  return (
    <div className="quality-message">
      <div className="quality-score" style={{ borderColor: scoreColor }}>
        <div className="quality-score-value" style={{ color: scoreColor }}>
          {score}
          <span className="quality-score-max">/100</span>
        </div>
        <div className="quality-score-label">Quality Score</div>
      </div>

      {(completeness !== undefined || structure !== undefined || standards !== undefined || bestPractices !== undefined) && (
        <div className="quality-breakdown">
          <div className="quality-breakdown-header">Breakdown:</div>
          <div className="quality-breakdown-items">
            {completeness !== undefined && (
              <div className="quality-breakdown-item">
                <span className="quality-breakdown-label">Completeness:</span>
                <span className="quality-breakdown-value">{completeness}/40</span>
                <div className="quality-breakdown-bar">
                  <div 
                    className="quality-breakdown-fill" 
                    style={{ width: `${(completeness / 40) * 100}%`, backgroundColor: scoreColor }}
                  />
                </div>
              </div>
            )}
            {structure !== undefined && (
              <div className="quality-breakdown-item">
                <span className="quality-breakdown-label">Structure:</span>
                <span className="quality-breakdown-value">{structure}/30</span>
                <div className="quality-breakdown-bar">
                  <div 
                    className="quality-breakdown-fill" 
                    style={{ width: `${(structure / 30) * 100}%`, backgroundColor: scoreColor }}
                  />
                </div>
              </div>
            )}
            {standards !== undefined && (
              <div className="quality-breakdown-item">
                <span className="quality-breakdown-label">Standards:</span>
                <span className="quality-breakdown-value">{standards}/20</span>
                <div className="quality-breakdown-bar">
                  <div 
                    className="quality-breakdown-fill" 
                    style={{ width: `${(standards / 20) * 100}%`, backgroundColor: scoreColor }}
                  />
                </div>
              </div>
            )}
            {bestPractices !== undefined && (
              <div className="quality-breakdown-item">
                <span className="quality-breakdown-label">Best Practices:</span>
                <span className="quality-breakdown-value">{bestPractices}/10</span>
                <div className="quality-breakdown-bar">
                  <div 
                    className="quality-breakdown-fill" 
                    style={{ width: `${(bestPractices / 10) * 100}%`, backgroundColor: scoreColor }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {score >= 85 && (
        <div className="quality-status quality-pass">
          ✓ Meets quality threshold (85/100)
        </div>
      )}
      {score < 85 && (
        <div className="quality-status quality-improving">
          ⚠ Improving quality...
        </div>
      )}
    </div>
  );
}
