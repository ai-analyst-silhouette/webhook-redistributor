import React, { useState, useEffect } from 'react';
import api from '../api';
import './EndpointStats.css';

const EndpointStats = ({ selectedEndpoint = null, onEndpointSelect }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchStats();
  }, [timeRange, selectedEndpoint, fetchStats]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = selectedEndpoint 
        ? `/api/logs/stats/by-endpoint?endpoint=${selectedEndpoint}&range=${timeRange}`
        : `/api/logs/stats/by-endpoint?range=${timeRange}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching endpoint stats:', err);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getUsagePercentage = (endpointUsage, totalUsage) => {
    if (totalUsage === 0) return 0;
    return Math.round((endpointUsage / totalUsage) * 100);
  };

  const getMostUsedEndpoint = () => {
    if (!stats?.endpoints) return null;
    return stats.endpoints.reduce((max, endpoint) => 
      endpoint.usage_count > max.usage_count ? endpoint : max
    );
  };

  const getLeastUsedEndpoint = () => {
    if (!stats?.endpoints) return null;
    return stats.endpoints.reduce((min, endpoint) => 
      endpoint.usage_count < min.usage_count ? endpoint : min
    );
  };

  const getTotalUsage = () => {
    if (!stats?.endpoints) return 0;
    return stats.endpoints.reduce((total, endpoint) => total + endpoint.usage_count, 0);
  };

  if (loading) {
    return (
      <div className="endpoint-stats">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="endpoint-stats">
        <div className="stats-error">
          <div className="error-icon">⚠️</div>
          <h3>Erro ao carregar estatísticas</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStats}>
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="endpoint-stats">
        <div className="stats-empty">
          <div className="empty-icon">📊</div>
          <h3>Nenhuma estatística disponível</h3>
          <p>As estatísticas aparecerão após o primeiro uso dos endpoints.</p>
        </div>
      </div>
    );
  }

  const totalUsage = getTotalUsage();
  const mostUsed = getMostUsedEndpoint();
  const leastUsed = getLeastUsedEndpoint();

  return (
    <div className="endpoint-stats">
      <div className="stats-header">
        <h2>📊 Estatísticas por Endpoint</h2>
        <div className="stats-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1h">Última hora</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
          {selectedEndpoint && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onEndpointSelect && onEndpointSelect(null)}
            >
              👁️ Ver Todos
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="overview-card">
          <div className="card-icon">🔗</div>
          <div className="card-content">
            <div className="card-number">{stats.endpoints?.length || 0}</div>
            <div className="card-label">Endpoints Ativos</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-number">{formatNumber(totalUsage)}</div>
            <div className="card-label">Total de Uso</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <div className="card-number">
              {stats.avg_response_time ? `${stats.avg_response_time}ms` : 'N/A'}
            </div>
            <div className="card-label">Tempo Médio</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="card-number">
              {stats.success_rate ? `${stats.success_rate}%` : 'N/A'}
            </div>
            <div className="card-label">Taxa de Sucesso</div>
          </div>
        </div>
      </div>

      {/* Endpoint Usage Distribution */}
      {stats.endpoints && stats.endpoints.length > 0 && (
        <div className="usage-distribution">
          <h3>Distribuição de Uso</h3>
          <div className="distribution-chart">
            {stats.endpoints.map((endpoint, index) => {
              const percentage = getUsagePercentage(endpoint.usage_count, totalUsage);
              const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
              const color = colors[index % colors.length];
              
              return (
                <div
                  key={endpoint.slug}
                  className="distribution-item"
                  onClick={() => onEndpointSelect && onEndpointSelect(endpoint.slug)}
                  style={{ cursor: onEndpointSelect ? 'pointer' : 'default' }}
                >
                  <div className="distribution-header">
                    <div className="endpoint-info">
                      <span className="endpoint-name">{endpoint.name}</span>
                      <span className="endpoint-slug">/{endpoint.slug}</span>
                    </div>
                    <div className="usage-count">{formatNumber(endpoint.usage_count)}</div>
                  </div>
                  <div className="distribution-bar">
                    <div
                      className="distribution-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                  <div className="distribution-percentage">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Most/Least Used */}
      {mostUsed && leastUsed && (
        <div className="usage-extremes">
          <div className="extreme-card most-used">
            <div className="extreme-icon">🏆</div>
            <div className="extreme-content">
              <h4>Mais Usado</h4>
              <div className="extreme-endpoint">{mostUsed.name}</div>
              <div className="extreme-count">{formatNumber(mostUsed.usage_count)} usos</div>
            </div>
          </div>

          <div className="extreme-card least-used">
            <div className="extreme-icon">📉</div>
            <div className="extreme-content">
              <h4>Menos Usado</h4>
              <div className="extreme-endpoint">{leastUsed.name}</div>
              <div className="extreme-count">{formatNumber(leastUsed.usage_count)} usos</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className="recent-activity">
          <h3>Atividade Recente</h3>
          <div className="activity-list">
            {stats.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.status === 'success' ? '✅' : '❌'}
                </div>
                <div className="activity-content">
                  <div className="activity-endpoint">{activity.endpoint_name}</div>
                  <div className="activity-details">
                    {activity.method} • {activity.response_time}ms • {activity.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EndpointStats;
