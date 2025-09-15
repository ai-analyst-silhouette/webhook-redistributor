import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick && onClick(e);
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${loading ? 'loading' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      <div className="btn-content">
        {loading && (
          <div className="btn-loading">
            <Loader2 size={16} className="loading-spinner" />
          </div>
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon size={16} className="btn-icon" />
        )}
        
        {children && (
          <span className="btn-text">{children}</span>
        )}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon size={16} className="btn-icon" />
        )}
      </div>
      
      <div className="btn-ripple"></div>
    </button>
  );
};

export default Button;
