import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, CheckCircle, XCircle, Calendar, Target, Activity } from 'lucide-react';
import api from '../api';
import Skeleton from './ui/Skeleton';
import ProgressBar from './ui/ProgressBar';
import estatisticaIcon from '../assets/icons/estatistica.png';
import './Stats.css';

const Stats = ({ onMessage, isVisible = true }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      fetchStats(false); // Primeira carga não é auto-refresh
      // Refresh stats every 10 seconds para dados mais atualizados
      const interval = setInterval(() => fetchStats(true), 10000);
      return () => clearInterval(interval);
    }
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async (isAutoRefresh = false) => {
    try {
      setError(null);
      
      // Só mostra loading se não for auto-refresh
      if (!isAutoRefresh) {
        setLoading(true);
      }
      
      const token = localStorage.getItem('authToken') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ad2ViaG9vay5sb2NhbCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Nzg3NzA2NiwiZXhwIjoxNzU3OTYzNDY2fQ.wsB9X0lOTehbClmUywzz6BXNeoIi27hoI_FANnnxTcY';
      
      const response = await api.get('/api/logs-webhook/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
        if (!hasLoadedRef.current && onMessage) {
          onMessage('success', 'Estatísticas carregadas com sucesso!');
          hasLoadedRef.current = true;
        }
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error connecting to server');
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  const formatNumber = (num) => {
    return num ? num.toLocaleString('pt-BR') : '0';
  };

  const getSuccessRateColor = (rate) => {
    const rateNum = parseFloat(rate);
    if (rateNum >= 90) return '#28a745';
    if (rateNum >= 70) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="stats-header">
          <h2>
            <img 
              src={estatisticaIcon} 
              alt="Estatísticas" 
              className="header-icon"
            />
            Estatísticas
          </h2>
        </div>
        <div className="skeleton-stats">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton-stat-card">
              <div className="skeleton-stat-header">
                <Skeleton width="40px" height="40px" borderRadius="var(--radius-md)" />
                <Skeleton width="60%" height="16px" />
              </div>
              <Skeleton width="80%" height="32px" />
              <Skeleton width="50%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="stats-header">
          <h2>
            <img 
              src={estatisticaIcon} 
              alt="Estatísticas" 
              className="header-icon"
            />
            Estatísticas
          </h2>
          <button onClick={fetchStats} className="btn btn-primary">
            🔄 Tentar Novamente
          </button>
        </div>
        <div className="error-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>
          <img 
            src={estatisticaIcon} 
            alt="Estatísticas" 
            className="header-icon"
          />
          Estatísticas
        </h2>
        <button onClick={fetchStats} className="btn btn-primary">
          🔄 Atualizar
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.total)}</div>
            <div className="stat-label">Total de Webhooks</div>
            <div className="stat-description">Recebidos desde sempre</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.successful)}</div>
            <div className="stat-label">Bem-sucedidos</div>
            <div className="stat-description">Processados sem erros</div>
            <ProgressBar 
              value={stats.successful} 
              max={stats.total} 
              variant="success" 
              size="sm"
              className="stat-progress"
            />
          </div>
        </div>

        <div className="stat-card error">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.errors)}</div>
            <div className="stat-label">Erros</div>
            <div className="stat-description">Falhas no processamento</div>
            <ProgressBar 
              value={stats.errors} 
              max={stats.total} 
              variant="error" 
              size="sm"
              className="stat-progress"
            />
          </div>
        </div>

        <div className="stat-card today">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.today)}</div>
            <div className="stat-label">Hoje</div>
            <div className="stat-description">Recebidos hoje</div>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div 
              className="stat-value"
              style={{ color: getSuccessRateColor(stats.success_rate) }}
            >
              {stats.success_rate}%
            </div>
            <div className="stat-label">Taxa de Sucesso</div>
            <div className="stat-description">Desempenho geral</div>
            <ProgressBar 
              value={parseFloat(stats.success_rate)} 
              max={100} 
              variant="primary" 
              size="sm"
              className="stat-progress"
            />
          </div>
        </div>

        <div className="stat-card destinations">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.total > 0 ? Math.round(stats.successful / stats.total * 100) : 0}%
            </div>
            <div className="stat-label">Eficiência</div>
            <div className="stat-description">Relação sucesso vs total</div>
          </div>
        </div>
      </div>

      <div className="stats-summary">
        <h3>📋 Resumo</h3>
        <div className="summary-content">
          <p>
            <strong>Total de webhooks processados:</strong> {formatNumber(stats.total)}
          </p>
          <p>
            <strong>Taxa de sucesso:</strong> 
            <span style={{ color: getSuccessRateColor(stats.success_rate) }}>
              {stats.success_rate}%
            </span>
            {' '}({formatNumber(stats.successful)} bem-sucedidos, {formatNumber(stats.errors)} erros)
          </p>
          <p>
            <strong>Atividade de hoje:</strong> {formatNumber(stats.today)} webhooks recebidos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
