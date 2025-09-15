import React from 'react';
import './UnsavedIndicator.css';

const UnsavedIndicator = ({ 
  hasUnsavedChanges = false, 
  onSave, 
  onDiscard,
  saving = false 
}) => {
  if (!hasUnsavedChanges) return null;

  return (
    <div className="unsaved-indicator">
      <div className="unsaved-content">
        <span className="unsaved-icon">⚠️</span>
        <span className="unsaved-text">Você tem alterações não salvas</span>
        <div className="unsaved-actions">
          <button 
            className="btn btn-sm btn-secondary"
            onClick={onDiscard}
            disabled={saving}
          >
            Descartar
          </button>
          <button 
            className="btn btn-sm btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedIndicator;
