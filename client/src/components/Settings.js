import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Copy, ToggleLeft, ToggleRight, Save, RefreshCw, Globe, Shield, Database, Bell } from 'lucide-react';
import axios from 'axios';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import ToggleSwitch from './ui/ToggleSwitch';
import IconButton from './ui/IconButton';
import { CopyIcon, TestTubeIcon } from './ui/icons';
import config from '../config';
import './Settings.css';

const Settings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    webhookUrl: config.getBackendUrl() + '/api/webhook', // Default fallback
    redistributionEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [backendStatus, setBackendStatus] = useState({
    isOnline: false,
    database: 'PostgreSQL',
    lastCheck: null
  });

  // Função para verificar status do backend
  const checkBackendStatus = async () => {
    try {
      const response = await axios.get(config.getBackendUrl() + '/health', {
        timeout: 5000
      });
      
      if (response.status === 200) {
        setBackendStatus(prev => ({
          ...prev,
          isOnline: true,
          lastCheck: new Date().toLocaleTimeString('pt-BR')
        }));
        return true;
      }
    } catch (error) {
      console.error('Backend status check failed:', error);
      setBackendStatus(prev => ({
        ...prev,
        isOnline: false,
        lastCheck: new Date().toLocaleTimeString('pt-BR')
      }));
      return false;
    }
  };

  useEffect(() => {
    // Get current webhook URL - use backend URL in production, localhost in development
    const webhookUrl = config.getBackendUrl() + '/api/webhook';
    
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Webhook URL set:', webhookUrl);
    
    setSettings(prev => {
      const newSettings = { ...prev, webhookUrl };
      console.log('Settings updated:', newSettings);
      return newSettings;
    });

    // Verificar status do backend
    checkBackendStatus();

    // Verificar status a cada 30 segundos
    const statusInterval = setInterval(checkBackendStatus, 30000);

    return () => clearInterval(statusInterval);
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
    if (!settings.webhookUrl) {
      showMessage('error', 'URL do webhook não está definida');
      return;
    }

    setLoading(true);
    try {
      console.log('Testing webhook URL:', settings.webhookUrl);
      
      const response = await axios.post(settings.webhookUrl, {
        test: true,
        message: 'Test webhook from settings',
        timestamp: new Date().toISOString(),
        source: 'settings-test'
      }, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Webhook response:', response);
      
      if (response.status === 200) {
        showMessage('success', 'Webhook endpoint funcionando corretamente!');
      } else {
        showMessage('error', `Webhook retornou status ${response.status}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      
      if (error.code === 'ECONNREFUSED') {
        showMessage('error', 'Servidor não está rodando ou não acessível');
      } else if (error.response) {
        showMessage('error', `Erro do servidor: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        showMessage('error', 'Não foi possível conectar ao servidor');
      } else {
        showMessage('error', 'Erro ao testar webhook endpoint');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings.webhookUrl) {
    return (
      <div className="settings-container">
        <div className="settings-header">
          <h2>
            <SettingsIcon size={24} />
            Configurações
          </h2>
        </div>
        <div className="settings-skeleton">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-card">
              <Skeleton width="200px" height="24px" />
              <Skeleton width="100%" height="60px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="section-header">
        <div className="page-title">
          <SettingsIcon className="icon-img" />
          <h2>Configurações</h2>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} fade-in`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        {/* Webhook Endpoint Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Globe size={24} />
            </div>
            <div className="section-title">
              <h3>Webhook Endpoint</h3>
              <p>URL principal para recebimento de webhooks</p>
            </div>
          </div>
          <div className="section-content">
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
                <IconButton
                  onClick={copyWebhookUrl}
                  title="Copiar URL"
                  type="copy"
                >
                  <CopyIcon />
                </IconButton>
                <IconButton
                  onClick={testWebhookEndpoint}
                  disabled={loading}
                  title="Testar endpoint"
                  type="test"
                >
                  <TestTubeIcon size={16} />
                </IconButton>
              </div>
              <small className="text-muted">
                Use esta URL para enviar webhooks para o sistema de redistribuição
              </small>
            </div>
          </div>
        </div>

        {/* Redistribuição Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <RefreshCw size={24} />
            </div>
            <div className="section-title">
              <h3>Redistribuição</h3>
              <p>Controle da redistribuição automática</p>
            </div>
          </div>
          <div className="section-content">
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
                <ToggleSwitch
                  id="redistribution-toggle"
                  checked={settings.redistributionEnabled}
                  onChange={handleRedistributionToggle}
                  disabled={loading}
                  ariaLabel="Ativar/desativar redistribuição automática"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sistema Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Database size={24} />
            </div>
            <div className="section-title">
              <h3>Informações do Sistema</h3>
              <p>Status e configurações do servidor</p>
            </div>
          </div>
          <div className="section-content">
            <div className="info-grid">
              <div className="info-item">
                <strong>Status:</strong>
                <span className={backendStatus.isOnline ? 'status-online' : 'status-offline'}>
                  {backendStatus.isOnline ? 'Ativo 🟢' : 'Offline 🔴'}
                </span>
              </div>
              <div className="info-item">
                <strong>Porta Backend:</strong>
                <span>3001</span>
              </div>
              <div className="info-item">
                <strong>Porta Frontend:</strong>
                <span>3000</span>
              </div>
              <div className="info-item">
                <strong>Banco de Dados:</strong>
                <span>{backendStatus.database}</span>
              </div>
              <div className="info-item">
                <strong>Última Verificação:</strong>
                <span>{backendStatus.lastCheck || 'Nunca'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
