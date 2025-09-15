import React from 'react';
import './IconButton.css';

const IconButton = ({ 
  onClick, 
  title, 
  variant = 'default',
  disabled = false,
  children,
  className = '',
  type = 'default'
}) => {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`icon-button ${variant} ${type} ${className}`}
    >
      {children}
    </button>
  );
};

export default IconButton;
