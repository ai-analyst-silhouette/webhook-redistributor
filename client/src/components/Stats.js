import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, CheckCircle, XCircle, Calendar, Target, Activity } from 'lucide-react';
import api from '../api';
import config from '../config';
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
      
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.get(config.routes.logs + '/stats');
      
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
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao conectar com o servidor';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
            <div className="stat-value">{formatNumber(stats?.total || 0)}</div>
            <div className="stat-label">Total de Webhooks</div>
            <div className="stat-description">Recebidos desde sempre</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats?.successful || 0)}</div>
            <div className="stat-label">Bem-sucedidos</div>
            <div className="stat-description">Processados sem erros</div>
            <ProgressBar 
              value={stats?.successful || 0} 
              max={stats?.total || 1} 
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
            <div className="stat-value">{formatNumber(stats?.errors || 0)}</div>
            <div className="stat-label">Erros</div>
            <div className="stat-description">Falhas no processamento</div>
            <ProgressBar 
              value={stats?.errors || 0} 
              max={stats?.total || 1} 
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
            <div className="stat-value">{formatNumber(stats?.today || 0)}</div>
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
              style={{ color: getSuccessRateColor(stats?.success_rate || 0) }}
            >
              {stats?.success_rate || 0}%
            </div>
            <div className="stat-label">Taxa de Sucesso</div>
            <div className="stat-description">Desempenho geral</div>
            <ProgressBar 
              value={parseFloat(stats?.success_rate || 0)} 
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
              {stats?.total > 0 ? Math.round((stats?.successful || 0) / stats.total * 100) : 0}%
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
            <strong>Total de webhooks processados:</strong> {formatNumber(stats?.total || 0)}
          </p>
          <p>
            <strong>Taxa de sucesso:</strong> 
            <span style={{ color: getSuccessRateColor(stats?.success_rate || 0) }}>
              {stats?.success_rate || 0}%
            </span>
            {' '}({formatNumber(stats?.successful || 0)} bem-sucedidos, {formatNumber(stats?.errors || 0)} erros)
          </p>
          <p>
            <strong>Atividade de hoje:</strong> {formatNumber(stats?.today || 0)} webhooks recebidos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
