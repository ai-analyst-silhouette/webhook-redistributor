import React, { useState, useEffect } from 'react';
import api from '../api';
import DestinationForm from './DestinationForm';
import EndpointManager from './EndpointManager';
import EndpointStats from './EndpointStats';
import QuickSetup from './QuickSetup';
import EndpointDocs from './EndpointDocs';
import BackupManager from './BackupManager';
import Logs from './Logs';
import Stats from './Stats';
import Settings from './Settings';
import DestinationTester from './DestinationTester';
import './Dashboard.css';

const Dashboard = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentView, setCurrentView] = useState('destinations');
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [redistributionEnabled, setRedistributionEnabled] = useState(true);
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  useEffect(() => {
    fetchDestinations();
    fetchEndpoints();
  }, []);

  const fetchDestinations = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/destinations');
      
      if (response.data.success) {
        setDestinations(response.data.data);
        showMessage('success', 'Destinos carregados com sucesso!');
      } else {
        throw new Error('Failed to fetch destinations');
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
      const errorMessage = 'Error connecting to server. Make sure the backend is running on port 3002.';
      setError(errorMessage);
      
      // Auto-retry logic
      if (retryCount < 3) {
        showMessage('warning', `Tentativa ${retryCount + 1} falhou. Tentando novamente em 3 segundos...`);
        setTimeout(() => {
          fetchDestinations(retryCount + 1);
        }, 3000);
      } else {
        showMessage('error', 'Falha ao conectar após 3 tentativas. Verifique se o servidor está rodando.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const response = await api.get('/api/endpoints');
      if (response.data.success) {
        setEndpoints(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching endpoints:', err);
    }
  };

  const handleDestinationAdded = (newDestination) => {
    setDestinations(prev => [newDestination, ...prev]);
    showMessage('success', 'Destino adicionado com sucesso!');
  };

  const handleError = (errorMessage) => {
    showMessage('error', errorMessage);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleEndpointSelect = (endpointSlug) => {
    setSelectedEndpoint(endpointSlug);
  };

  const handleQuickSetupComplete = (result) => {
    setShowQuickSetup(false);
    fetchDestinations();
    fetchEndpoints();
    showMessage('success', `Configuração rápida concluída! Endpoint ${result.endpoint.name} criado com ${result.destinations.length} destino(s).`);
  };

  const handleQuickSetupCancel = () => {
    setShowQuickSetup(false);
  };

  const getFilteredDestinations = () => {
    if (!selectedEndpoint) return destinations;
    return destinations.filter(dest => 
      dest.endpoint && dest.endpoint.slug === selectedEndpoint
    );
  };

  const toggleDestinationStatus = async (id, currentStatus) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await api.put(`/api/destinations/${id}`, {
        active: !currentStatus
      });
      
      if (response.data.success) {
        setDestinations(prev => 
          prev.map(dest => 
            dest.id === id 
              ? { ...dest, active: !currentStatus }
              : dest
          )
        );
        showMessage('success', `Destino ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        throw new Error(response.data.message || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Error toggling destination status:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Destino não encontrado. Atualize a página.';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente.';
        } else {
          errorMessage = error.response.data?.message || `Erro HTTP ${error.response.status}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout - servidor não respondeu. Verifique a conexão.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
      }
      
      showMessage('error', `Falha ao ${!currentStatus ? 'ativar' : 'desativar'} destino: ${errorMessage}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteDestination = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover o destino "${name}"?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await api.delete(`/api/destinations/${id}`);
      
      if (response.data.success) {
        setDestinations(prev => prev.filter(dest => dest.id !== id));
        showMessage('success', 'Destino removido com sucesso!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting destination:', error);
      showMessage('error', error.response?.data?.message || 'Erro ao remover destino');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSettingsChange = (newSettings) => {
    if (newSettings.redistributionEnabled !== undefined) {
      setRedistributionEnabled(newSettings.redistributionEnabled);
    }
  };

  const handleTestComplete = (destinationId, success, status) => {
    const destination = destinations.find(d => d.id === destinationId);
    if (destination) {
      showMessage(
        success ? 'success' : 'error',
        `Teste do destino "${destination.name}": ${success ? 'Sucesso' : 'Falha'} (${status})`
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (active) => {
    return active ? (
      <span className="status-badge status-active">Active</span>
    ) : (
      <span className="status-badge status-inactive">Inactive</span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading destinations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={fetchDestinations} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🔗 Webhook Redistributor</h1>
        <p>Manage your webhook destinations and monitor redistribution status</p>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={`nav-button ${currentView === 'destinations' ? 'active' : ''}`}
          onClick={() => setCurrentView('destinations')}
        >
          🎯 Destinos
        </button>
        <button
          className={`nav-button ${currentView === 'endpoints' ? 'active' : ''}`}
          onClick={() => setCurrentView('endpoints')}
        >
          🔗 Endpoints
        </button>
        <button
          className={`nav-button ${currentView === 'logs' ? 'active' : ''}`}
          onClick={() => setCurrentView('logs')}
        >
          📊 Logs
        </button>
        <button
          className={`nav-button ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentView('stats')}
        >
          📈 Estatísticas
        </button>
        <button
          className={`nav-button ${currentView === 'docs' ? 'active' : ''}`}
          onClick={() => setCurrentView('docs')}
        >
          📚 Documentação
        </button>
        <button
          className={`nav-button ${currentView === 'backup' ? 'active' : ''}`}
          onClick={() => setCurrentView('backup')}
        >
          💾 Backup
        </button>
        <button
          className={`nav-button ${currentView === 'quick-setup' ? 'active' : ''}`}
          onClick={() => setCurrentView('quick-setup')}
        >
          ⚡ Configuração Rápida
        </button>
      </nav>

      <div className="dashboard-content">
        {/* Message Display */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Endpoints View */}
        {currentView === 'endpoints' && (
          <EndpointManager onMessage={showMessage} />
        )}

        {/* Documentation View */}
        {currentView === 'docs' && (
          <EndpointDocs />
        )}

        {/* Backup View */}
        {currentView === 'backup' && (
          <BackupManager onMessage={showMessage} />
        )}

        {/* Destinations View */}
        {currentView === 'destinations' && (
          <>
            {/* Settings */}
            <Settings onSettingsChange={handleSettingsChange} />

            {/* Statistics */}
            <Stats />

            {/* Add Destination Form */}
            <DestinationForm 
              onDestinationAdded={handleDestinationAdded}
              onError={handleError}
            />
            
            {/* Endpoint Filter */}
            <div className="endpoint-filter">
              <h3>Filtrar por Endpoint</h3>
              <div className="filter-controls">
                <button
                  className={`filter-btn ${!selectedEndpoint ? 'active' : ''}`}
                  onClick={() => setSelectedEndpoint(null)}
                >
                  👁️ Todos ({destinations.length})
                </button>
                {endpoints.map(endpoint => (
                  <button
                    key={endpoint.id}
                    className={`filter-btn ${selectedEndpoint === endpoint.slug ? 'active' : ''}`}
                    onClick={() => setSelectedEndpoint(endpoint.slug)}
                  >
                    🔗 {endpoint.name} ({destinations.filter(d => d.endpoint?.slug === endpoint.slug).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="destinations-section">
              <div className="section-header">
                <h2>
                  Destinos {selectedEndpoint ? `- ${endpoints.find(e => e.slug === selectedEndpoint)?.name}` : ''} 
                  ({getFilteredDestinations().length})
                </h2>
                <button onClick={fetchDestinations} className="btn btn-primary">
                  🔄 Refresh
                </button>
              </div>

          {getFilteredDestinations().length === 0 ? (
            <div className="empty-state">
              <p>
                {selectedEndpoint 
                  ? `Nenhum destino encontrado para o endpoint "${endpoints.find(e => e.slug === selectedEndpoint)?.name}"`
                  : 'Nenhum destino configurado ainda.'
                }
              </p>
              <p>Adicione destinos usando o formulário acima ou a API.</p>
            </div>
          ) : (
            <div className="destinations-grid">
              {getFilteredDestinations().map((destination) => (
                <div key={destination.id} className="destination-card">
                  <div className="destination-header">
                    <h3>{destination.name}</h3>
                    {getStatusBadge(destination.active)}
                  </div>
                  
                  <div className="destination-details">
                    <div className="detail-item">
                      <strong>URL:</strong>
                      <span className="url-text" title={destination.url}>
                        {destination.url}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <strong>Created:</strong>
                      <span>{formatDate(destination.created_at)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <strong>ID:</strong>
                      <span className="id-text">#{destination.id}</span>
                    </div>
                  </div>

                  <div className="destination-actions">
                    <button
                      onClick={() => toggleDestinationStatus(destination.id, destination.active)}
                      className={`btn btn-sm ${destination.active ? 'btn-warning' : 'btn-success'}`}
                      disabled={actionLoading[destination.id]}
                    >
                      {actionLoading[destination.id] ? (
                        <span className="spinner"></span>
                      ) : (
                        destination.active ? '⏸️ Desativar' : '▶️ Ativar'
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteDestination(destination.id, destination.name)}
                      className="btn btn-sm btn-danger"
                      disabled={actionLoading[destination.id]}
                    >
                      {actionLoading[destination.id] ? (
                        <span className="spinner"></span>
                      ) : (
                        '🗑️ Remover'
                      )}
                    </button>
                  </div>

                  {/* Destination Tester */}
                  <DestinationTester 
                    destination={destination}
                    onTestComplete={handleTestComplete}
                  />
                </div>
              ))}
            </div>
          )}
            </div>

            <div className="info-section">
              <h3>ℹ️ How it works</h3>
              <ul>
                <li>Webhooks sent to <code>/api/webhook</code> are automatically redistributed to all active destinations</li>
                <li>Only destinations marked as "Active" will receive webhooks</li>
                <li>Use the API endpoints to manage destinations</li>
                <li>Check the logs and statistics above for detailed monitoring</li>
              </ul>
            </div>
          </>
        )}

        {/* Logs View */}
        {currentView === 'logs' && (
          <Logs />
        )}

        {/* Stats View */}
        {currentView === 'stats' && (
          <Stats />
        )}

        {/* Endpoint Stats View */}
        {currentView === 'endpoint-stats' && (
          <EndpointStats 
            selectedEndpoint={selectedEndpoint}
            onEndpointSelect={handleEndpointSelect}
          />
        )}

        {/* Quick Setup View */}
        {currentView === 'quick-setup' && (
          <QuickSetup 
            onComplete={handleQuickSetupComplete}
            onCancel={handleQuickSetupCancel}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
