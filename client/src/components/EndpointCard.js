import React, { useState } from 'react';
import './EndpointCard.css';

const EndpointCard = ({ 
  endpoint, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  onViewDestinations,
  onCopyUrl 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(endpoint.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting endpoint:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUrl = () => {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://redistribuidor-back.silhouetteexperts.com.br'
      : 'http://localhost:3001';
    const fullUrl = `${backendUrl}/api/webhook/${endpoint.slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      onCopyUrl && onCopyUrl(`URL copiada: ${fullUrl}`);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      onCopyUrl && onCopyUrl('Erro ao copiar URL');
    });
  };

  const getStatusBadge = () => {
    if (endpoint.active) {
      return <span className="status-badge status-active">Ativo</span>;
    }
    return <span className="status-badge status-inactive">Inativo</span>;
  };

  const getDestinationsCount = () => {
    const total = endpoint.destinations?.total || 0;
    const active = endpoint.destinations?.active || 0;
    return `${active}/${total}`;
  };

  return (
    <div className={`endpoint-card ${!endpoint.active ? 'inactive' : ''}`}>
      <div className="endpoint-header">
        <div className="endpoint-title">
          <h3>{endpoint.name}</h3>
          {getStatusBadge()}
        </div>
        <div className="endpoint-actions">
          <button
            className="btn btn-sm btn-outline"
            onClick={handleCopyUrl}
            title="Copiar URL do endpoint"
          >
            📋 Copiar URL
          </button>
        </div>
      </div>

      <div className="endpoint-content">
        <div className="endpoint-info">
          <div className="info-row">
            <span className="label">Slug:</span>
            <code className="slug">{endpoint.slug}</code>
          </div>
          
          <div className="info-row">
            <span className="label">URL:</span>
            <code className="url">
              {process.env.NODE_ENV === 'production' 
                ? `https://redistribuidor-back.silhouetteexperts.com.br/api/webhook/${endpoint.slug}`
                : `http://localhost:3001/api/webhook/${endpoint.slug}`
              }
            </code>
          </div>

          {endpoint.description && (
            <div className="info-row">
              <span className="label">Descrição:</span>
              <span className="description">{endpoint.description}</span>
            </div>
          )}

          <div className="info-row">
            <span className="label">Destinos:</span>
            <span className="destinations-count">
              {getDestinationsCount()} {endpoint.destinations?.total === 1 ? 'destino' : 'destinos'}
            </span>
          </div>
        </div>

        <div className="endpoint-actions-bottom">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onEdit(endpoint)}
            title="Editar endpoint"
          >
            ✏️ Editar
          </button>

          <button
            className={`btn btn-sm ${endpoint.active ? 'btn-warning' : 'btn-success'}`}
            onClick={() => onToggleStatus(endpoint.id, !endpoint.active)}
            title={endpoint.active ? 'Desativar endpoint' : 'Ativar endpoint'}
          >
            {endpoint.active ? '⏸️ Desativar' : '▶️ Ativar'}
          </button>

          <button
            className="btn btn-sm btn-info"
            onClick={() => onViewDestinations(endpoint)}
            title="Ver destinos deste endpoint"
          >
            👁️ Ver Destinos
          </button>

          {endpoint.slug !== 'default' && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              title="Deletar endpoint"
              disabled={endpoint.destinations?.active > 0}
            >
              🗑️ Deletar
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h4>Confirmar Exclusão</h4>
            <p>
              Tem certeza que deseja deletar o endpoint <strong>"{endpoint.name}"</strong>?
            </p>
            <p className="warning-text">
              ⚠️ Esta ação não pode ser desfeita.
            </p>
            {endpoint.destinations?.active > 0 && (
              <p className="error-text">
                ❌ Não é possível deletar um endpoint que possui destinos ativos.
              </p>
            )}
            <div className="confirm-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={handleDelete}
                disabled={isDeleting || endpoint.destinations?.active > 0}
              >
                {isDeleting ? 'Deletando...' : 'Sim, Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndpointCard;
