import React, { useState, useEffect } from 'react';
import api from '../api';
import EndpointCard from './EndpointCard';
import EndpointForm from './EndpointForm';
import './EndpointManager.css';

const EndpointManager = ({ onMessage }) => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [viewingDestinations, setViewingDestinations] = useState(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/endpoints');
      
      if (response.data.success) {
        setEndpoints(response.data.data);
        onMessage && onMessage('success', 'Endpoints carregados com sucesso!');
      } else {
        throw new Error('Failed to fetch endpoints');
      }
    } catch (err) {
      console.error('Error fetching endpoints:', err);
      const errorMessage = 'Erro ao carregar endpoints. Verifique se o servidor está rodando.';
      setError(errorMessage);
      onMessage && onMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEndpoint = () => {
    setEditingEndpoint(null);
    setShowForm(true);
  };

  const handleEditEndpoint = (endpoint) => {
    setEditingEndpoint(endpoint);
    setShowForm(true);
  };

  const handleSaveEndpoint = (savedEndpoint) => {
    if (editingEndpoint) {
      // Update existing endpoint
      setEndpoints(prev => 
        prev.map(ep => ep.id === savedEndpoint.id ? savedEndpoint : ep)
      );
      onMessage && onMessage('success', 'Endpoint atualizado com sucesso!');
    } else {
      // Add new endpoint
      setEndpoints(prev => [savedEndpoint, ...prev]);
      onMessage && onMessage('success', 'Endpoint criado com sucesso!');
    }
    setShowForm(false);
    setEditingEndpoint(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEndpoint(null);
  };

  const handleToggleStatus = async (endpointId, newStatus) => {
    try {
      const endpoint = endpoints.find(ep => ep.id === endpointId);
      if (!endpoint) return;

      const response = await api.put(`/api/endpoints/${endpointId}`, {
        name: endpoint.name,
        slug: endpoint.slug,
        description: endpoint.description,
        active: newStatus
      });

      if (response.data.success) {
        setEndpoints(prev => 
          prev.map(ep => ep.id === endpointId ? { ...ep, active: newStatus } : ep)
        );
        onMessage && onMessage('success', `Endpoint ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      }
    } catch (err) {
      console.error('Error toggling endpoint status:', err);
      onMessage && onMessage('error', 'Erro ao alterar status do endpoint');
    }
  };

  const handleDeleteEndpoint = async (endpointId) => {
    try {
      const response = await api.delete(`/api/endpoints/${endpointId}`);
      
      if (response.data.success) {
        setEndpoints(prev => prev.filter(ep => ep.id !== endpointId));
        onMessage && onMessage('success', 'Endpoint deletado com sucesso!');
      }
    } catch (err) {
      console.error('Error deleting endpoint:', err);
      if (err.response?.data?.message) {
        onMessage && onMessage('error', err.response.data.message);
      } else {
        onMessage && onMessage('error', 'Erro ao deletar endpoint');
      }
    }
  };

  const handleViewDestinations = (endpoint) => {
    setViewingDestinations(endpoint);
  };

  const handleCopyUrl = (message) => {
    onMessage && onMessage('info', message);
  };

  const handleFormError = (error) => {
    console.error('Form error:', error);
    if (typeof error === 'string') {
      onMessage && onMessage('info', error);
    } else {
      onMessage && onMessage('error', 'Erro no formulário');
    }
  };

  if (showForm) {
    return (
      <div className="endpoint-manager">
        <EndpointForm
          endpoint={editingEndpoint}
          onSave={handleSaveEndpoint}
          onCancel={handleCancelForm}
          onError={handleFormError}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="endpoint-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando endpoints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="endpoint-manager">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Erro ao carregar endpoints</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchEndpoints}>
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="endpoint-manager">
      <div className="endpoint-manager-header">
        <div className="header-content">
          <h2>Gerenciar Endpoints</h2>
          <p>Configure endpoints personalizados para receber webhooks</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateEndpoint}
          >
            ➕ Novo Endpoint
          </button>
        </div>
      </div>

      <div className="endpoints-stats">
        <div className="stat-card">
          <div className="stat-number">{endpoints.length}</div>
          <div className="stat-label">Total de Endpoints</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {endpoints.filter(ep => ep.active).length}
          </div>
          <div className="stat-label">Endpoints Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {endpoints.reduce((sum, ep) => sum + (ep.destinations?.total || 0), 0)}
          </div>
          <div className="stat-label">Total de Destinos</div>
        </div>
      </div>

      {endpoints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <h3>Nenhum endpoint encontrado</h3>
          <p>Crie seu primeiro endpoint personalizado para começar a receber webhooks.</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateEndpoint}
          >
            ➕ Criar Primeiro Endpoint
          </button>
        </div>
      ) : (
        <div className="endpoints-grid">
          {endpoints.map(endpoint => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              onEdit={handleEditEndpoint}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteEndpoint}
              onViewDestinations={handleViewDestinations}
              onCopyUrl={handleCopyUrl}
            />
          ))}
        </div>
      )}

      {viewingDestinations && (
        <div className="destinations-modal-overlay">
          <div className="destinations-modal">
            <div className="modal-header">
              <h3>Destinos do Endpoint: {viewingDestinations.name}</h3>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setViewingDestinations(null)}
              >
                ✕ Fechar
              </button>
            </div>
            <div className="modal-content">
              <p>
                <strong>URL:</strong> {window.location.protocol}//{window.location.hostname}:3002/api/webhook/{viewingDestinations.slug}
              </p>
              <p>
                <strong>Destinos:</strong> {viewingDestinations.destinations?.active || 0} ativos de {viewingDestinations.destinations?.total || 0} total
              </p>
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setViewingDestinations(null);
                    // Here you could navigate to destinations page filtered by endpoint
                  }}
                >
                  👁️ Ver Destinos Detalhados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndpointManager;
