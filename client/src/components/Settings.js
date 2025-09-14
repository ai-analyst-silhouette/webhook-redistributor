import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    webhookUrl: '',
    redistributionEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Get current webhook URL - use backend URL in production, localhost in development
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? 'https://redistribuidor-back.silhouetteexperts.com.br/api/webhook'
      : 'http://localhost:3002/api/webhook';
    setSettings(prev => ({ ...prev, webhookUrl }));
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleRedistributionToggle = async () => {
    setLoading(true);
    try {
      // This would be a real API call in a production app
      const newValue = !settings.redistributionEnabled;
      setSettings(prev => ({ ...prev, redistributionEnabled: newValue }));
      
      if (onSettingsChange) {
        onSettingsChange({ redistributionEnabled: newValue });
      }
      
      showMessage('success', `Redistribuição ${newValue ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Error updating settings:', error);
      showMessage('error', 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(settings.webhookUrl).then(() => {
      showMessage('success', 'URL copiada para a área de transferência!');
    }).catch(() => {
      showMessage('error', 'Erro ao copiar URL');
    });
  };

  const testWebhookEndpoint = async () => {
    setLoading(true);
    try {
      const response = await axios.post(settings.webhookUrl, {
        test: true,
        message: 'Test webhook from settings',
        timestamp: new Date().toISOString(),
        source: 'settings-test'
      });
      
      if (response.data.success) {
        showMessage('success', 'Webhook endpoint funcionando corretamente!');
      } else {
        showMessage('error', 'Webhook endpoint retornou erro');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      showMessage('error', 'Erro ao testar webhook endpoint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Configurações</h2>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <div className="setting-group">
          <h3>🔗 Webhook Endpoint</h3>
          <div className="setting-item">
            <label className="form-label">URL do Webhook</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={settings.webhookUrl}
                readOnly
                placeholder="URL do webhook endpoint"
              />
              <button
                onClick={copyWebhookUrl}
                className="btn btn-secondary"
                title="Copiar URL"
              >
                📋 Copiar
              </button>
              <button
                onClick={testWebhookEndpoint}
                className="btn btn-primary"
                disabled={loading}
                title="Testar endpoint"
              >
                {loading ? <span className="spinner"></span> : '🧪 Testar'}
              </button>
            </div>
            <small className="text-muted">
              Use esta URL para enviar webhooks para o sistema de redistribuição
            </small>
          </div>
        </div>

        <div className="setting-group">
          <h3>🔄 Redistribuição</h3>
          <div className="setting-item">
            <div className="toggle-setting">
              <div className="toggle-info">
                <label className="toggle-label">Redistribuição Automática</label>
                <p className="toggle-description">
                  {settings.redistributionEnabled 
                    ? 'Webhooks serão automaticamente redistribuídos para todos os destinos ativos'
                    : 'Webhooks serão recebidos mas não redistribuídos'
                  }
                </p>
              </div>
              <button
                onClick={handleRedistributionToggle}
                className={`toggle-button ${settings.redistributionEnabled ? 'active' : ''}`}
                disabled={loading}
              >
                <span className="toggle-slider">
                  {loading ? <span className="spinner"></span> : (
                    settings.redistributionEnabled ? 'ON' : 'OFF'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <h3>📊 Informações do Sistema</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Status:</strong>
              <span className={`status-indicator ${settings.redistributionEnabled ? 'active' : 'inactive'}`}>
                {settings.redistributionEnabled ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="info-item">
              <strong>Porta Backend:</strong>
              <span>3002</span>
            </div>
            <div className="info-item">
              <strong>Porta Frontend:</strong>
              <span>3000</span>
            </div>
            <div className="info-item">
              <strong>Banco de Dados:</strong>
              <span>SQLite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
