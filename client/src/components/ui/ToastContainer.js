import React, { useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString();
    const newToast = { id, ...toast };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expor métodos globalmente para uso em toda a aplicação
  React.useEffect(() => {
    window.toast = {
      success: (title, message, duration) => addToast({ type: 'success', title, message, duration }),
      error: (title, message, duration) => addToast({ type: 'error', title, message, duration }),
      warning: (title, message, duration) => addToast({ type: 'warning', title, message, duration }),
      info: (title, message, duration) => addToast({ type: 'info', title, message, duration }),
      clear: clearAllToasts
    };
  }, [addToast, clearAllToasts]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
