import React, { useState } from 'react';
import axios from 'axios';
import './DestinationTester.css';

const DestinationTester = ({ destination, onTestComplete }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testDestination = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const testPayload = {
        test: true,
        message: 'Test webhook from destination tester',
        timestamp: new Date().toISOString(),
        source: 'destination-tester',
        destination: {
          id: destination.id,
          name: destination.name,
          url: destination.url
        }
      };

      const response = await axios.post(destination.url, testPayload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhook-Redistributor-Tester/1.0',
          'X-Test-Source': 'destination-tester'
        }
      });

      setTestResult({
        success: true,
        status: response.status,
        statusText: response.statusText,
        responseTime: Date.now() - Date.now(), // This would be calculated properly in real implementation
        data: response.data
      });

      if (onTestComplete) {
        onTestComplete(destination.id, true, response.status);
      }

    } catch (error) {
      let errorMessage = 'Erro desconhecido';
      let status = 0;

      if (error.response) {
        status = error.response.status;
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout - destino não respondeu em 10 segundos';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Não foi possível conectar ao destino';
      } else {
        errorMessage = error.message;
      }

      setTestResult({
        success: false,
        status,
        error: errorMessage,
        responseTime: 0
      });

      if (onTestComplete) {
        onTestComplete(destination.id, false, status);
      }
    } finally {
      setTesting(false);
    }
  };

  const clearResult = () => {
    setTestResult(null);
  };

  return (
    <div className="destination-tester">
      <div className="tester-header">
        <h4>🧪 Teste de Destino</h4>
        <div className="tester-actions">
          <button
            onClick={testDestination}
            className="btn btn-primary btn-sm"
            disabled={testing || !destination.active}
          >
            {testing ? (
              <>
                <span className="spinner"></span>
                Testando...
              </>
            ) : (
              'Testar Destino'
            )}
          </button>
          {testResult && (
            <button
              onClick={clearResult}
              className="btn btn-secondary btn-sm"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {!destination.active && (
        <div className="alert alert-warning">
          ⚠️ Destino está desativado. Ative-o para testar.
        </div>
      )}

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <span className="result-icon">
              {testResult.success ? '✅' : '❌'}
            </span>
            <span className="result-status">
              {testResult.success ? 'Sucesso' : 'Falha'}
            </span>
            {testResult.status > 0 && (
              <span className="result-code">
                HTTP {testResult.status}
              </span>
            )}
          </div>
          
          <div className="result-details">
            {testResult.success ? (
              <div>
                <p><strong>Status:</strong> {testResult.status} {testResult.statusText}</p>
                <p><strong>Resposta:</strong> Destino respondeu corretamente</p>
                {testResult.data && (
                  <details className="response-details">
                    <summary>Ver resposta completa</summary>
                    <pre className="response-data">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div>
                <p><strong>Erro:</strong> {testResult.error}</p>
                {testResult.status > 0 && (
                  <p><strong>Status HTTP:</strong> {testResult.status}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tester-info">
        <small className="text-muted">
          Envia um webhook de teste para <code>{destination.url}</code>
        </small>
      </div>
    </div>
  );
};

export default DestinationTester;
