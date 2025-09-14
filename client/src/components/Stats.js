import React, { useState, useEffect } from 'react';
import api from '../api';
import './Stats.css';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await api.get('/api/logs/stats');
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
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
          <h2>📊 Statistics</h2>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="stats-header">
          <h2>📊 Statistics</h2>
          <button onClick={fetchStats} className="btn btn-primary">
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
    <div className="stats-container">
      <div className="stats-header">
        <h2>📊 Statistics</h2>
        <button onClick={fetchStats} className="btn btn-primary">
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.total)}</div>
            <div className="stat-label">Total Webhooks</div>
            <div className="stat-description">All time received</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.successful)}</div>
            <div className="stat-label">Successful</div>
            <div className="stat-description">Processed without errors</div>
          </div>
        </div>

        <div className="stat-card error">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.errors)}</div>
            <div className="stat-label">Errors</div>
            <div className="stat-description">Failed processing</div>
          </div>
        </div>

        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(stats.today)}</div>
            <div className="stat-label">Today</div>
            <div className="stat-description">Received today</div>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div 
              className="stat-value"
              style={{ color: getSuccessRateColor(stats.success_rate) }}
            >
              {stats.success_rate}%
            </div>
            <div className="stat-label">Success Rate</div>
            <div className="stat-description">Overall performance</div>
          </div>
        </div>

        <div className="stat-card destinations">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.total > 0 ? Math.round(stats.successful / stats.total * 100) : 0}%
            </div>
            <div className="stat-label">Efficiency</div>
            <div className="stat-description">Success vs total ratio</div>
          </div>
        </div>
      </div>

      <div className="stats-summary">
        <h3>📋 Summary</h3>
        <div className="summary-content">
          <p>
            <strong>Total webhooks processed:</strong> {formatNumber(stats.total)}
          </p>
          <p>
            <strong>Success rate:</strong> 
            <span style={{ color: getSuccessRateColor(stats.success_rate) }}>
              {stats.success_rate}%
            </span>
            {' '}({formatNumber(stats.successful)} successful, {formatNumber(stats.errors)} errors)
          </p>
          <p>
            <strong>Today's activity:</strong> {formatNumber(stats.today)} webhooks received
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
