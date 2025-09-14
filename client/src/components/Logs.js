import React, { useState, useEffect } from 'react';
import api from '../api';
import './Logs.css';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
    fetchEndpoints();
  }, []);

  const fetchLogs = async (endpoint = null, status = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/logs?limit=50';
      if (endpoint) {
        url = `/api/logs/endpoint/${endpoint}?limit=50`;
      }
      if (status !== 'all') {
        url += `&status=${status}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setLogs(response.data.data);
      } else {
        setError('Failed to fetch webhook logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Error connecting to server. Make sure the backend is running on port 3002.');
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

  const handleEndpointFilter = (endpointSlug) => {
    setSelectedEndpoint(endpointSlug);
    fetchLogs(endpointSlug, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchLogs(selectedEndpoint, status);
  };

  const getFilteredLogs = () => {
    let filtered = logs;
    
    if (selectedEndpoint) {
      filtered = filtered.filter(log => log.endpoint_slug === selectedEndpoint);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => {
        if (statusFilter === 'success') return log.status === 200;
        if (statusFilter === 'error') return log.status >= 400;
        return true;
      });
    }
    
    return filtered;
  };

  const getEndpointName = (endpointSlug) => {
    const endpoint = endpoints.find(ep => ep.slug === endpointSlug);
    return endpoint ? endpoint.name : endpointSlug || 'Default';
  };

  const getEndpointColor = (endpointSlug) => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const index = endpoints.findIndex(ep => ep.slug === endpointSlug);
    return colors[index % colors.length] || '#6c757d';
  };

  const toggleLogExpansion = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPayload = (payloadString) => {
    try {
      const parsed = JSON.parse(payloadString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return payloadString;
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status}`}>
        {status === 'success' ? '✅' : '❌'} {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="logs-container">
        <div className="logs-header">
          <h2>📋 Webhook Logs</h2>
          <button onClick={fetchLogs} className="btn btn-primary" disabled>
            🔄 Loading...
          </button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading webhook logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="logs-container">
        <div className="logs-header">
          <h2>📋 Webhook Logs</h2>
          <button onClick={fetchLogs} className="btn btn-primary">
            🔄 Retry
          </button>
        </div>
        <div className="error-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>📋 Webhook Logs</h2>
        <div className="header-actions">
          <span className="logs-count">{getFilteredLogs().length} recent webhooks</span>
          <button onClick={() => fetchLogs(selectedEndpoint, statusFilter)} className="btn btn-primary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-group">
          <label className="filter-label">Endpoint:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${!selectedEndpoint ? 'active' : ''}`}
              onClick={() => handleEndpointFilter(null)}
            >
              👁️ Todos
            </button>
            {endpoints.map(endpoint => (
              <button
                key={endpoint.id}
                className={`filter-btn ${selectedEndpoint === endpoint.slug ? 'active' : ''}`}
                onClick={() => handleEndpointFilter(endpoint.slug)}
                style={{ borderLeftColor: getEndpointColor(endpoint.slug) }}
              >
                🔗 {endpoint.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('all')}
            >
              📊 Todos
            </button>
            <button
              className={`filter-btn ${statusFilter === 'success' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('success')}
            >
              ✅ Sucesso
            </button>
            <button
              className={`filter-btn ${statusFilter === 'error' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('error')}
            >
              ❌ Erro
            </button>
          </div>
        </div>
      </div>

      {getFilteredLogs().length === 0 ? (
        <div className="empty-state">
          <p>
            {selectedEndpoint 
              ? `Nenhum log encontrado para o endpoint "${getEndpointName(selectedEndpoint)}"`
              : 'Nenhum log de webhook encontrado.'
            }
          </p>
          <p>Envie alguns webhooks para vê-los aqui!</p>
        </div>
      ) : (
        <div className="logs-list">
          {getFilteredLogs().map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-header" onClick={() => toggleLogExpansion(log.id)}>
                <div className="log-info">
                  <div className="log-id">#{log.id}</div>
                  <div className="log-time">{formatDate(log.received_at)}</div>
                  <div 
                    className="log-endpoint"
                    style={{ 
                      backgroundColor: getEndpointColor(log.endpoint_slug),
                      color: 'white'
                    }}
                  >
                    🔗 {getEndpointName(log.endpoint_slug)}
                  </div>
                  <div className="log-destinations">
                    {log.destinations_sent} destination{log.destinations_sent !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="log-actions">
                  {getStatusBadge(log.status)}
                  <span className="expand-icon">
                    {expandedLogs.has(log.id) ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {expandedLogs.has(log.id) && (
                <div className="log-details">
                  <div className="log-payload">
                    <h4>Payload:</h4>
                    <pre className="payload-content">
                      {formatPayload(log.payload)}
                    </pre>
                  </div>
                  
                  {log.error_message && (
                    <div className="log-error">
                      <h4>Error:</h4>
                      <p>{log.error_message}</p>
                    </div>
                  )}
                  
                  <div className="log-meta">
                    <div className="meta-item">
                      <strong>Status:</strong> {log.status}
                    </div>
                    <div className="meta-item">
                      <strong>Destinations Sent:</strong> {log.destinations_sent}
                    </div>
                    <div className="meta-item">
                      <strong>Received At:</strong> {formatDate(log.received_at)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Logs;
