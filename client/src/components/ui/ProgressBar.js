import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  animated = false,
  striped = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-bar-container progress-${size} ${className}`} {...props}>
      {showLabel && (
        <div className="progress-label">
          <span className="progress-text">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className="progress-track">
        <div
          className={`progress-fill progress-${variant} ${animated ? 'progress-animated' : ''} ${striped ? 'progress-striped' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
