import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Link, 
  BarChart3, 
  Clock,
  ChevronDown,
  Filter,
  Download,
  Search
} from 'lucide-react';
import api from '../api';
import config from '../config';
import useAutoRefresh from '../hooks/useAutoRefresh';
import logsIcon from '../assets/icons/logs.png';
import './Logs.css';

const Logs = ({ onMessage, isVisible = true }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [redirecionamentos, setRedirecionamentos] = useState([]);
  const [selectedRedirecionamento, setSelectedRedirecionamento] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newLogsCount, setNewLogsCount] = useState(0);
  const [previousLogsLength, setPreviousLogsLength] = useState(0);
  const hasLoadedRef = useRef(false);

  // Auto-refresh dos logs a cada 3 segundos quando visível
  const refreshLogs = useCallback(() => {
    fetchLogs(selectedRedirecionamento, statusFilter, true); // true = isAutoRefresh
  }, [selectedRedirecionamento, statusFilter]);

  useAutoRefresh(refreshLogs, 3000, autoRefresh && isVisible, [selectedRedirecionamento, statusFilter]);

  useEffect(() => {
    fetchLogs();
    fetchRedirecionamentos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async (redirecionamento = null, status = 'all', isAutoRefresh = false) => {
    try {
      console.log('🔄 fetchLogs chamado:', { redirecionamento, status, isAutoRefresh });
      
      // Só mostra loading se não for auto-refresh
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setError(null);
      
      let url = `${config.routes.logs}?limit=50`;
      if (redirecionamento) {
        url = `${config.routes.logs}?slug_redirecionamento=${redirecionamento}&limit=50`;
      }
      if (status !== 'all') {
        url += `&status=${status}`;
      }
      
      console.log('🌐 URL da requisição:', url);
      
      const response = await api.get(url);
      
      if (response.data.success) {
        const newLogs = response.data.data;
        
        console.log('📥 Logs recebidos da API:', {
          count: newLogs.length,
          logs: newLogs.map(log => ({
            id: log.id,
            status: log.status,
            slug_redirecionamento: log.slug_redirecionamento
          }))
        });
        
        // Detectar novos logs apenas durante auto-refresh
        if (isAutoRefresh && newLogs.length > previousLogsLength) {
          const newCount = newLogs.length - previousLogsLength;
          setNewLogsCount(newCount);
          
          // Limpar contador após 3 segundos
          setTimeout(() => setNewLogsCount(0), 3000);
        }
        
        setLogs(newLogs);
        setPreviousLogsLength(newLogs.length);
        setLastUpdate(new Date());
        
        if (!hasLoadedRef.current && onMessage) {
          onMessage('success', 'Logs carregados com sucesso!');
          hasLoadedRef.current = true;
        }
      } else {
        setError('Falha ao carregar logs de webhook');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar logs:', err);
      
      // Se for erro de autenticação, não mostrar erro, apenas deixar o interceptor lidar
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Erro de autenticação ao carregar logs');
        return;
      }
      
      setError('Erro ao conectar com o servidor. Verifique se o backend está rodando na porta 3001.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRedirecionamentos = async () => {
    try {
      const response = await api.get(config.routes.redirecionamentos);
      
      if (response.data.success) {
        setRedirecionamentos(response.data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar redirecionamentos:', err);
      
      // Se for erro de autenticação, não mostrar erro, apenas deixar o interceptor lidar
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Erro de autenticação ao carregar redirecionamentos para logs');
        return;
      }
    }
  };

  const handleRedirecionamentoFilter = (redirecionamentoSlug) => {
    setSelectedRedirecionamento(redirecionamentoSlug);
    fetchLogs(redirecionamentoSlug, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    fetchLogs(selectedRedirecionamento, status);
  };

  const getFilteredLogs = () => {
    if (!logs || logs.length === 0) {
      console.log('⚠️ Nenhum log disponível para filtrar');
      return [];
    }
    
    let filtered = [...logs]; // Cria uma cópia para não modificar o array original
    
    console.log('🔍 Filtros aplicados:', {
      totalLogs: logs.length,
      selectedRedirecionamento,
      statusFilter,
      logs: logs.map(log => ({
        id: log.id,
        status: log.status,
        slug_redirecionamento: log.slug_redirecionamento
      }))
    });
    
    // Filtro por redirecionamento
    if (selectedRedirecionamento && selectedRedirecionamento !== '') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(log => {
        const matches = log.slug_redirecionamento === selectedRedirecionamento;
        console.log(`📍 Log ${log.id}: slug=${log.slug_redirecionamento}, selected=${selectedRedirecionamento}, matches=${matches}`);
        return matches;
      });
      console.log(`📍 Filtro por redirecionamento: ${beforeCount} → ${filtered.length}`);
    }
    
    // Filtro por status
    if (statusFilter && statusFilter !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(log => {
        let matches = false;
        if (statusFilter === 'success') {
          matches = log.status === 200;
        } else if (statusFilter === 'error') {
          matches = log.status >= 400;
        }
        console.log(`📊 Log ${log.id}: status=${log.status}, filter=${statusFilter}, matches=${matches}`);
        return matches;
      });
      console.log(`📊 Filtro por status: ${beforeCount} → ${filtered.length}`);
    }
    
    console.log('✅ Resultado final:', filtered.length, 'logs');
    return filtered;
  };

  const getRedirecionamentoName = (redirecionamentoSlug) => {
    const redirecionamento = redirecionamentos.find(r => r.slug === redirecionamentoSlug);
    return redirecionamento ? redirecionamento.nome : redirecionamentoSlug || 'Padrão';
  };

  const getRedirecionamentoColor = (redirecionamentoSlug) => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    const index = redirecionamentos.findIndex(r => r.slug === redirecionamentoSlug);
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
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
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
    const statusText = status === 200 ? 'Sucesso' : 'Erro';
    return (
      <span className={`status-badge ${status === 200 ? 'success' : 'error'}`}>
        {status === 200 ? <CheckCircle size={16} /> : <XCircle size={16} />} 
        <span className="status-text">{statusText}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="logs-container">
        <div className="logs-header">
          <h2>
            <img 
              src={logsIcon} 
              alt="Logs" 
              className="header-icon"
            />
            Histórico de Webhooks
          </h2>
          <button onClick={fetchLogs} className="btn btn-primary" disabled>
            <RefreshCw size={16} className="spinning" />
            Carregando...
          </button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando logs de webhook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="logs-container">
        <div className="logs-header">
          <h2>
            <img 
              src={logsIcon} 
              alt="Logs" 
              className="header-icon"
            />
            Histórico de Webhooks
          </h2>
          <button onClick={fetchLogs} className="btn btn-primary">
            <RefreshCw size={16} />
            Tentar Novamente
          </button>
        </div>
        <div className="error-state">
          <p><XCircle size={16} /> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>
          <img 
            src={logsIcon} 
            alt="Logs" 
            className="header-icon"
          />
          Histórico de Webhooks
        </h2>
        <div className="header-actions">
          <div className="auto-refresh-controls">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="toggle-text">
                <RefreshCw size={16} />
                Auto-atualizar (3s)
              </span>
            </label>
          </div>
          <span className="logs-count">
            <BarChart3 size={16} />
            {getFilteredLogs().length} webhooks recentes
            {newLogsCount > 0 && (
              <span className="new-logs-badge">
                +{newLogsCount} novo{newLogsCount > 1 ? 's' : ''}
              </span>
            )}
            {lastUpdate && autoRefresh && (
              <span className="last-update">
                <Clock size={14} />
                Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </span>
          <button onClick={() => fetchLogs(selectedRedirecionamento, statusFilter)} className="btn btn-primary">
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-group">
          <label className="filter-label">
            <Filter size={16} />
            Filtrar por redirecionamento:
          </label>
          <div className="filter-select-container">
            <select
              className="filter-select"
              value={selectedRedirecionamento || ''}
              onChange={(e) => handleRedirecionamentoFilter(e.target.value || null)}
            >
              <option value="">Todos os redirecionamentos</option>
              {redirecionamentos.map(redirecionamento => (
                <option key={redirecionamento.id} value={redirecionamento.slug}>
                  {redirecionamento.nome}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="select-arrow" />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <BarChart3 size={16} />
            Filtrar por status:
          </label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('all')}
            >
              <BarChart3 size={16} />
              Todos
            </button>
            <button
              className={`filter-btn ${statusFilter === 'success' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('success')}
            >
              <CheckCircle size={16} />
              Sucesso
            </button>
            <button
              className={`filter-btn ${statusFilter === 'error' ? 'active' : ''}`}
              onClick={() => handleStatusFilter('error')}
            >
              <XCircle size={16} />
              Erro
            </button>
          </div>
        </div>
      </div>

      {getFilteredLogs().length === 0 ? (
        <div className="empty-state">
          <img 
            src={logsIcon} 
            alt="Logs" 
            className="empty-icon"
          />
          <p>
            {selectedRedirecionamento 
              ? `Nenhum log encontrado para o redirecionamento "${getRedirecionamentoName(selectedRedirecionamento)}"`
              : 'Nenhum log de webhook encontrado.'
            }
          </p>
          <p>Envie alguns webhooks para vê-los aqui!</p>
        </div>
      ) : (
        <div className="logs-list">
          {getFilteredLogs().map((log, index) => (
            <div 
              key={log.id} 
              className={`log-item ${index < newLogsCount ? 'new-log' : ''}`}
            >
              <div className="log-header" onClick={() => toggleLogExpansion(log.id)}>
                <div className="log-info">
                  <div className="log-id">#{log.id}</div>
                  <div className="log-time">{formatDate(log.recebido_em)}</div>
                  <div 
                    className="log-endpoint"
                    style={{ 
                      backgroundColor: getRedirecionamentoColor(log.slug_redirecionamento),
                      color: 'white'
                    }}
                  >
                    <Link size={14} />
                    {getRedirecionamentoName(log.slug_redirecionamento)}
                  </div>
                  <div className="log-destinations">
                    {log.destinos_enviados} destino{log.destinos_enviados !== 1 ? 's' : ''} atingido{log.destinos_enviados !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="log-actions">
                  {getStatusBadge(log.status)}
                  <span className="expand-icon">
                    <ChevronDown size={16} className={expandedLogs.has(log.id) ? 'expanded' : ''} />
                  </span>
                </div>
              </div>
              
              {expandedLogs.has(log.id) && (
                <div className="log-details">
                  <div className="log-payload">
                    <h4>Dados do Webhook:</h4>
                    <pre className="payload-content">
                      {formatPayload(log.payload)}
                    </pre>
                  </div>
                  
                  {log.error_message && (
                    <div className="log-error">
                      <h4>Erro:</h4>
                      <p>{log.error_message}</p>
                    </div>
                  )}
                  
                  <div className="log-meta">
                    <div className="meta-item">
                      <strong>Status:</strong> {log.status}
                    </div>
                    <div className="meta-item">
                      <strong>Destinos Atingidos:</strong> {log.destinos_enviados}
                    </div>
                    <div className="meta-item">
                      <strong>Data/Hora:</strong> {formatDate(log.recebido_em)}
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
