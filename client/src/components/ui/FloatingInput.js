import React, { useState, useRef } from 'react';
import './FloatingInput.css';

const FloatingInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const isFloating = isFocused || value || (inputRef.current && inputRef.current.value);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <div className={`floating-input-container ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="floating-input-wrapper">
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}
        
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="floating-input"
          {...props}
        />
        
        <label 
          htmlFor={id}
          className={`floating-label ${isFloating ? 'floating' : ''}`}
        >
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
        
        <div className="input-focus-ring"></div>
      </div>
      
      {error && (
        <div className="input-error">
          <span className="error-icon">⚠</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FloatingInput;
