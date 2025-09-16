import React from 'react';
import IconButton from './ui/IconButton';
import { CloseIcon } from './ui/icons';
import './TestResultModal.css';

const TestResultModal = ({ 
  isOpen, 
  onClose, 
  testResults 
}) => {
  if (!isOpen || !testResults) return null;

  const { redirecionamento, results, statistics, payload, testedAt } = testResults;

  const formatResponseData = (data) => {
    if (!data) return 'Sem dados de resposta';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="test-result-modal-overlay" onClick={onClose}>
      <div className="test-result-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="test-result-modal-header">
          <h3>🧪 Resultados do Teste de Webhook</h3>
          <IconButton
            onClick={onClose}
            title="Fechar"
            type="danger"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="test-result-modal-body">
          {/* Informações do Redirecionamento */}
          <div className="test-info-section">
            <h4>📋 Informações do Teste</h4>
            <div className="info-grid">
              <div className="info-item">
                <strong>Redirecionamento:</strong>
                <span>{redirecionamento.nome} ({redirecionamento.slug})</span>
              </div>
              <div className="info-item">
                <strong>Testado em:</strong>
                <span>{formatDateTime(testedAt)}</span>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="statistics-section">
            <h4>📊 Estatísticas</h4>
            <div className="stats-grid">
              <div className="stat-card success">
                <div className="stat-value">{statistics.successful}</div>
                <div className="stat-label">Sucessos</div>
              </div>
              <div className="stat-card error">
                <div className="stat-value">{statistics.failed}</div>
                <div className="stat-label">Falhas</div>
              </div>
              <div className="stat-card total">
                <div className="stat-value">{statistics.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-card rate">
                <div className="stat-value">{statistics.successRate}%</div>
                <div className="stat-label">Taxa de Sucesso</div>
              </div>
              <div className="stat-card time">
                <div className="stat-value">{statistics.avgResponseTime}ms</div>
                <div className="stat-label">Tempo Médio</div>
              </div>
            </div>
          </div>

          {/* Payload Enviado */}
          <div className="payload-section">
            <h4>📤 Payload Enviado</h4>
            <pre className="payload-code">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          {/* Resultados por Destino */}
          <div className="results-section">
            <h4>🎯 Resultados por Destino</h4>
            <div className="results-list">
              {results.map((result, index) => (
                <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <div className="result-status">
                      {result.success ? '✅' : '❌'}
                    </div>
                    <div className="result-destino">
                      <strong>{result.destino.nome}</strong>
                      <div className="result-url">{result.destino.url}</div>
                    </div>
                    <div className="result-timing">
                      {result.responseTime}ms
                    </div>
                  </div>
                  
                  <div className="result-details">
                    {result.success ? (
                      <>
                        <div className="result-status-info">
                          <span className="status-badge success">
                            {result.status} {result.statusText}
                          </span>
                        </div>
                        {result.responseData && (
                          <div className="result-response">
                            <strong>Resposta:</strong>
                            <pre className="response-code">
                              {formatResponseData(result.responseData)}
                            </pre>
                          </div>
                        )}
                        {result.headers && (
                          <details className="result-headers">
                            <summary>Headers de Resposta</summary>
                            <pre className="headers-code">
                              {JSON.stringify(result.headers, null, 2)}
                            </pre>
                          </details>
                        )}
                      </>
                    ) : (
                      <div className="result-error">
                        <div className="result-status-info">
                          <span className="status-badge error">
                            {result.status > 0 ? `${result.status} ${result.statusText}` : 'Erro de Rede'}
                          </span>
                        </div>
                        <div className="error-message">
                          <strong>Erro:</strong> {result.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="test-result-modal-footer">
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultModal;
