import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`toast toast-${type} toast-${position} ${isExiting ? 'toast-exiting' : ''}`}
      {...props}
    >
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-body">
          {title && <div className="toast-title">{title}</div>}
          {message && <div className="toast-message">{message}</div>}
        </div>
        <button
          className="toast-close"
          onClick={handleClose}
          aria-label="Fechar notificação"
        >
          <X size={16} />
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default Toast;
