import React from 'react';
import './DeleteUserModal.css';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, user, isLoading }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(user.id, user.nome);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button className="close-button" onClick={onClose} disabled={isLoading}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="warning-icon">
            ⚠️
          </div>
          <p>
            Tem certeza que deseja remover o usuário <strong>"{user?.nome}"</strong>?
          </p>
          <p className="warning-text">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Excluir Usuário'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
