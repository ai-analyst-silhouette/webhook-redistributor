import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ 
  progress = 0, 
  message = 'Processando...', 
  show = false,
  indeterminate = false 
}) => {
  if (!show) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-container">
        <div className="progress-message">{message}</div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${indeterminate ? 'indeterminate' : ''}`}
            style={{ width: indeterminate ? '100%' : `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        {!indeterminate && (
          <div className="progress-percentage">{Math.round(progress)}%</div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
