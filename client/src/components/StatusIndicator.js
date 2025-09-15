import React, { useState, useEffect, useCallback } from 'react';
import './StatusIndicator.css';

const StatusIndicator = ({ 
  url, 
  status = 'unknown', 
  onStatusChange,
  autoCheck = true,
  checkInterval = 15000, // 15 segundos para verificação mais frequente
  isVisible = true // Nova prop para controlar visibilidade
}) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!url || isChecking) return;
    
    setIsChecking(true);
    setCurrentStatus('checking');
    
    try {
      // Fazer uma requisição HEAD para verificar se o endpoint está online
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': '*/*'
        }
      });
      
      // Se chegou até aqui e a resposta é válida, o endpoint está online
      if (response.ok || response.status < 500) {
        setCurrentStatus('online');
        onStatusChange && onStatusChange('online');
      } else {
        setCurrentStatus('offline');
        onStatusChange && onStatusChange('offline');
      }
    } catch (error) {
      // Se deu erro, o endpoint está offline
      setCurrentStatus('offline');
      onStatusChange && onStatusChange('offline');
    } finally {
      setIsChecking(false);
    }
  }, [url, isChecking, onStatusChange]);

  useEffect(() => {
    if (autoCheck && url && isVisible) {
      // Verificar status imediatamente
      checkStatus();
      
      // Configurar verificação periódica apenas se visível
      const interval = setInterval(checkStatus, checkInterval);
      
      return () => clearInterval(interval);
    } else if (!autoCheck) {
      // Se autoCheck está desabilitado, manter status como unknown
      setCurrentStatus('unknown');
    }
  }, [url, autoCheck, checkInterval, checkStatus, isVisible]);

  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'online':
        return {
          class: 'online',
          icon: '🟢',
          text: 'Online',
          tooltip: 'Endpoint está respondendo'
        };
      case 'offline':
        return {
          class: 'offline',
          icon: '🔴',
          text: 'Offline',
          tooltip: 'Endpoint não está respondendo'
        };
      case 'checking':
        return {
          class: 'checking',
          icon: '🟡',
          text: 'Verificando...',
          tooltip: 'Verificando status do endpoint'
        };
      default:
        return {
          class: 'unknown',
          icon: '⚪',
          text: 'Desconhecido',
          tooltip: 'Status não verificado'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <span 
      className={`status-indicator ${statusInfo.class}`}
      title={statusInfo.tooltip}
      onClick={checkStatus}
    >
      <span className="status-icon">{statusInfo.icon}</span>
      <span className="status-text">{statusInfo.text}</span>
    </span>
  );
};

export default StatusIndicator;
