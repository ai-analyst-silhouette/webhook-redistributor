import React, { useState, useEffect } from 'react';
import api from '../../api';
import './Logs.css';

const Logs = ({ onMessage }) => {
  const [activeTab, setActiveTab] = useState('webhook');
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    status: '',
    slug_redirecionamento: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({});
  const [expandedLog, setExpandedLog] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    loadLogs();
  }, [activeTab, filters]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
        const interval = setInterval(() => {
          setRefreshing(true);
          Promise.all([
            loadStats(true), // Silent refresh
            loadLogs(true) // Silent refresh
          ]).finally(() => {
            setRefreshing(false);
          });
        }, 10000);

    return () => clearInterval(interval);
  }, [activeTab, filters]);

  const loadStats = async (silent = false) => {
    try {
      const response = await api.get('/api/logs/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      if (!silent) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    }
  };

  const loadLogs = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const endpoint = activeTab === 'webhook' ? '/api/logs/webhook' : '/api/logs/audit';
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`${endpoint}?${params.toString()}`);
      if (response.data.success) {
        if (activeTab === 'webhook') {
          setWebhookLogs(response.data.data.logs);
        } else {
          setAuditLogs(response.data.data.logs);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      if (!silent) {
        console.error('Erro ao carregar logs:', error);
        onMessage('error', 'Erro ao carregar logs');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      status: '',
      slug_redirecionamento: '',
      start_date: '',
      end_date: '',
      search: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'success': 'status-success',
      'error': 'status-error',
      'pending': 'status-pending',
      'warning': 'status-warning'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status}
      </span>
    );
  };

  const toggleExpandedLog = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const renderWebhookLogs = () => (
    <div className="logs-container">
      <div className="logs-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Slug:</label>
            <input
              type="text"
              value={filters.slug_redirecionamento}
              onChange={(e) => handleFilterChange('slug_redirecionamento', e.target.value)}
              placeholder="Filtrar por slug"
            />
          </div>
          
          <div className="filter-group">
            <label>Data Início:</label>
            <input
              type="datetime-local"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Data Fim:</label>
            <input
              type="datetime-local"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group search-group">
            <label>Buscar:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Buscar em payload, erro, IP, etc."
            />
          </div>
          
          <button className="btn btn-secondary" onClick={clearFilters}>
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Recebido em</th>
              <th>Status</th>
              <th>Slug</th>
              <th>Destinos</th>
              <th>Tempo (ms)</th>
              <th>IP Origem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {webhookLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{formatDate(log.recebido_em)}</td>
                <td>{getStatusBadge(log.status)}</td>
                <td>{log.slug_redirecionamento || '-'}</td>
                <td>{log.destinos_enviados || 0}</td>
                <td>{log.tempo_resposta || '-'}</td>
                <td>{log.ip_origem || '-'}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleExpandedLog(log.id)}
                  >
                    {expandedLog === log.id ? 'Ocultar' : 'Ver Detalhes'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expandedLog && (
        <div className="log-details">
          {webhookLogs
            .filter(log => log.id === expandedLog)
            .map(log => (
              <div key={log.id} className="log-detail-content">
                <h4>Detalhes do Log #{log.id}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Payload:</label>
                    <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                  </div>
                  {log.mensagem_erro && (
                    <div className="detail-item">
                      <label>Mensagem de Erro:</label>
                      <pre className="error-text">{log.mensagem_erro}</pre>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>User Agent:</label>
                    <span>{log.user_agent || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Headers:</label>
                    <pre>{JSON.stringify(log.headers, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="pagination">
        <button 
          className="btn btn-outline"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Anterior
        </button>
        <span>
          Página {pagination.page} de {pagination.pages} ({pagination.total} total)
        </span>
        <button 
          className="btn btn-outline"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
        >
          Próxima
        </button>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="logs-container">
      <div className="logs-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Ação:</label>
            <select 
              value={filters.acao} 
              onChange={(e) => handleFilterChange('acao', e.target.value)}
            >
              <option value="">Todas</option>
              <option value="create">Criar</option>
              <option value="update">Atualizar</option>
              <option value="delete">Excluir</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Recurso:</label>
            <select 
              value={filters.recurso_tipo} 
              onChange={(e) => handleFilterChange('recurso_tipo', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="redirecionamento">Redirecionamento</option>
              <option value="usuario">Usuário</option>
              <option value="destino">Destino</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Data Início:</label>
            <input
              type="datetime-local"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Data Fim:</label>
            <input
              type="datetime-local"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group search-group">
            <label>Buscar:</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Buscar em descrição, IP, etc."
            />
          </div>
          
          <button className="btn btn-secondary" onClick={clearFilters}>
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Usuário</th>
              <th>Ação</th>
              <th>Recurso</th>
              <th>Descrição</th>
              <th>IP</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{formatDate(log.timestamp)}</td>
                <td>{log.usuario_id || '-'}</td>
                <td>{getStatusBadge(log.acao)}</td>
                <td>{log.recurso_tipo || '-'}</td>
                <td className="description-cell">{log.descricao || '-'}</td>
                <td>{log.ip || '-'}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => toggleExpandedLog(log.id)}
                  >
                    {expandedLog === log.id ? 'Ocultar' : 'Ver Detalhes'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expandedLog && (
        <div className="log-details">
          {auditLogs
            .filter(log => log.id === expandedLog)
            .map(log => (
              <div key={log.id} className="log-detail-content">
                <h4>Detalhes do Log de Auditoria #{log.id}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>User Agent:</label>
                    <span>{log.user_agent || '-'}</span>
                  </div>
                  {log.dados_anteriores && (
                    <div className="detail-item">
                      <label>Dados Anteriores:</label>
                      <pre>{JSON.stringify(log.dados_anteriores, null, 2)}</pre>
                    </div>
                  )}
                  {log.dados_novos && (
                    <div className="detail-item">
                      <label>Dados Novos:</label>
                      <pre>{JSON.stringify(log.dados_novos, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="pagination">
        <button 
          className="btn btn-outline"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Anterior
        </button>
        <span>
          Página {pagination.page} de {pagination.pages} ({pagination.total} total)
        </span>
        <button 
          className="btn btn-outline"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
        >
          Próxima
        </button>
      </div>
    </div>
  );

  return (
    <div className="logs-page">
      <div className="page-header">
        <h2>Logs do Sistema {refreshing && <span className="refresh-indicator">🔄</span>}</h2>
        <p>Visualize e monitore todas as transações e atividades do sistema</p>
      </div>

      {stats.webhook && (
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Webhooks</h3>
            <div className="stat-value">{stats.webhook.total_webhooks || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card success">
            <h3>Sucessos</h3>
            <div className="stat-value">{stats.webhook.successful_webhooks || 0}</div>
            <div className="stat-label">Hoje: {stats.webhook.today_webhooks || 0}</div>
          </div>
          <div className="stat-card error">
            <h3>Erros</h3>
            <div className="stat-value">{stats.webhook.failed_webhooks || 0}</div>
            <div className="stat-label">Taxa de erro</div>
          </div>
          <div className="stat-card">
            <h3>Tempo Médio</h3>
            <div className="stat-value">{Math.round(stats.webhook.avg_response_time || 0)}ms</div>
            <div className="stat-label">Resposta</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'webhook' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhook')}
        >
          Logs de Webhook
        </button>
        <button 
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Logs de Auditoria
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando logs...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'webhook' && renderWebhookLogs()}
          {activeTab === 'audit' && renderAuditLogs()}
        </>
      )}
    </div>
  );
};

export default Logs;
