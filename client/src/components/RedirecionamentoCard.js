import React, { useState } from 'react';
import api from '../api';
import PermissionWrapper from './PermissionWrapper';
import StatusIndicator from './StatusIndicator';
import ToggleSwitch from './ui/ToggleSwitch';
import IconButton from './ui/IconButton';
import { EditIcon, DeleteIcon, CopyIcon } from './ui/icons';
import './RedirecionamentoCard.css';

const RedirecionamentoCard = ({
  redirecionamento,
  onEdit,
  onToggleStatus,
  onDelete,
  onTest,
  actionLoading,
  user
}) => {
  // Converter string de URLs em array se necessário
  const urlsArray = Array.isArray(redirecionamento.urls) 
    ? redirecionamento.urls 
    : (redirecionamento.urls || '').split(',').map(url => url.trim()).filter(url => url);

  // Estado para controlar quais URLs estão ativas
  const [activeUrls, setActiveUrls] = useState(() => {
    const initialState = {};
    urlsArray.forEach((url, index) => {
      // Se a URL é um objeto com propriedade ativo, usa ela, senão assume true
      initialState[index] = typeof url === 'object' && url.hasOwnProperty('ativo') ? url.ativo : true;
    });
    return initialState;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleUrlToggle = async (urlIndex) => {
    const newStatus = !activeUrls[urlIndex];
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.patch(`/api/redirecionamentos/${redirecionamento.id}/urls/${urlIndex}/toggle`, {
        ativo: newStatus
      }, {
        headers: {
        }
      });
      
      if (response.data.success) {
        setActiveUrls(prev => ({
          ...prev,
          [urlIndex]: newStatus
        }));
        console.log(`URL ${urlIndex} ${newStatus ? 'ativada' : 'desativada'} com sucesso`);
      } else {
        throw new Error(response.data.message || 'Erro ao alterar status da URL');
      }
    } catch (error) {
      console.error('Erro ao alterar status da URL:', error);
      // Revert the local state on error
      setActiveUrls(prev => ({
        ...prev,
        [urlIndex]: !newStatus
      }));
    }
  };

  const handleToggleRedirecionamento = () => {
    onToggleStatus(redirecionamento.id, redirecionamento.ativo);
  };

  const getWebhookUrl = () => {
    return process.env.NODE_ENV === 'production' 
      ? `https://redistribuidor-back.silhouetteexperts.com.br/api/webhook/${redirecionamento.slug}`
      : `http://localhost:3001/api/webhook/${redirecionamento.slug}`;
  };

  return (
    <div className="redirecionamento-card">
      <div className="card-header">
        <div className="card-title">
          <h3>{redirecionamento.nome}</h3>
          <div className="card-status">
            <ToggleSwitch
              id={`redirecionamento-toggle-${redirecionamento.id}`}
              checked={redirecionamento.ativo}
              onChange={handleToggleRedirecionamento}
              ariaLabel={`Ativar/desativar redirecionamento ${redirecionamento.nome}`}
            />
            <span className="status-label">
              {redirecionamento.ativo ? 'Ativo' : 'Clique para ativar'}
            </span>
          </div>
        </div>
        <div className="card-actions">
          <PermissionWrapper 
            permission="editar_redirecionamento" 
            user={user}
            fallback={
              <IconButton
                title="Você não tem permissão para editar redirecionamentos"
                disabled
              >
                <EditIcon />
              </IconButton>
            }
          >
            <IconButton
              onClick={() => onEdit(redirecionamento)}
              title="Editar redirecionamento"
              type="edit"
            >
              <EditIcon />
            </IconButton>
          </PermissionWrapper>
          
          <PermissionWrapper 
            permission="excluir_redirecionamento" 
            user={user}
            fallback={
              <IconButton
                title="Você não tem permissão para excluir redirecionamentos"
                disabled
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <IconButton
              onClick={() => onDelete(redirecionamento)}
              disabled={actionLoading[`delete-${redirecionamento.id}`]}
              title="Excluir redirecionamento"
              variant="danger"
              type="danger"
            >
              <DeleteIcon />
            </IconButton>
          </PermissionWrapper>
        </div>
      </div>

      <div className="card-content">
        {redirecionamento.descricao && (
          <div className="description">
            <p>{redirecionamento.descricao}</p>
          </div>
        )}

        <div className="webhook-url">
          <strong>URL do Webhook:</strong>
          <code className="url-code">{getWebhookUrl()}</code>
                        <IconButton
                          onClick={() => navigator.clipboard.writeText(getWebhookUrl())}
                          title="Copiar URL"
                          type="copy"
                        >
                          <CopyIcon />
                        </IconButton>
        </div>

        <div className="urls-section">
          <strong>URLs de Destino ({urlsArray.length}):</strong>
          {urlsArray.length > 0 ? (
            <div className="urls-list">
              {urlsArray.map((url, index) => (
                <div key={index} className={`url-item ${!activeUrls[index] ? 'url-disabled' : ''}`}>
                  <div className="url-content">
                    <div className="url-main">
                      <div className="url-header">
                        <span className="url-text" title={typeof url === 'string' ? url : url.url}>
                          {typeof url === 'string' ? url : url.url}
                        </span>
                        <IconButton
                          onClick={() => navigator.clipboard.writeText(typeof url === 'string' ? url : url.url)}
                          title="Copiar URL"
                          type="copy"
                        >
                          <CopyIcon />
                        </IconButton>
                      </div>
                      <div className="url-footer">
                        <div className="url-toggle-container">
                          <ToggleSwitch
                            id={`url-toggle-${redirecionamento.id}-${index}`}
                            checked={activeUrls[index]}
                            onChange={() => handleUrlToggle(index)}
                            ariaLabel={`Ativar/desativar URL ${index + 1}`}
                          />
                    <span className="toggle-label">
                      {activeUrls[index] ? 'URL Ativa' : 'Clique para ativar a URL'}
                    </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-urls">Nenhuma URL configurada</p>
          )}
        </div>

        <div className="card-meta">
          <div className="meta-item">
            <strong>ID:</strong>
            <span>#{redirecionamento.id}</span>
          </div>
          <div className="meta-item">
            <strong>Criado em:</strong>
            <span>{formatDate(redirecionamento.criado_em)}</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <PermissionWrapper 
          permission="testar_redirecionamento" 
          user={user}
          fallback={
            <button
              className="btn btn-primary btn-sm permission-disabled"
              title="Você não tem permissão para testar redirecionamentos"
              disabled
            >
              🧪 Testar Webhook
            </button>
          }
        >
          <button
            onClick={() => onTest(redirecionamento.id)}
            className="btn btn-primary btn-sm"
            disabled={actionLoading[`test-${redirecionamento.id}`] || !redirecionamento.ativo}
          >
            {actionLoading[`test-${redirecionamento.id}`] ? (
              <>
                <span className="spinner"></span>
                Testando...
              </>
            ) : (
              '🧪 Testar Webhook'
            )}
          </button>
        </PermissionWrapper>
      </div>
    </div>
  );
};

export default RedirecionamentoCard;
