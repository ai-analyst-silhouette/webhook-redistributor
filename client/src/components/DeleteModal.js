import React from 'react';
import IconButton from './ui/IconButton';
import { DeleteIcon, CloseIcon } from './ui/icons';
import './DeleteModal.css';

const DeleteModal = ({ 
  redirecionamento, 
  onClose, 
  onConfirm 
}) => {
  if (!redirecionamento) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <div className="warning-icon">
              ⚠️
            </div>
            <h3>Confirmar Exclusão</h3>
          </div>
          <IconButton
            onClick={onClose}
            title="Fechar"
            type="danger"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-content">
          <p className="warning-text">
            Tem certeza que deseja excluir o redirecionamento:
          </p>
          
          <div className="redirecionamento-info">
            <h4>{redirecionamento.nome}</h4>
            <p className="slug-info">
              <strong>Slug:</strong> {redirecionamento.slug}
            </p>
            <p className="url-info">
              <strong>URLs de destino:</strong> {redirecionamento.urls?.length || 0}
            </p>
          </div>

          <div className="warning-message">
            <p>⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita!</p>
            <p>O redirecionamento será permanentemente removido do sistema.</p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(redirecionamento);
              onClose();
            }}
            className="btn btn-danger"
          >
            Excluir Redirecionamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
