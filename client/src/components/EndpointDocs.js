/**
 * Endpoint Documentation Component
 * 
 * This component provides comprehensive documentation for webhook endpoints:
 * - Clear usage instructions for each endpoint
 * - TinyERP configuration examples for different events
 * - List of available URLs for easy copying
 * - Best practices and troubleshooting tips
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import './EndpointDocs.css';

const EndpointDocs = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/endpoints');
      setEndpoints(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedEndpoint(response.data.data[0]);
      }
    } catch (err) {
      setError('Erro ao carregar endpoints');
      console.error('Error fetching endpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getTinyERPExamples = (endpoint) => {
    const examples = {
      'vendas': {
        title: 'Configuração para Vendas',
        events: [
          {
            name: 'Pedido Criado',
            description: 'Quando um novo pedido é criado no TinyERP',
            url: `https://seu-dominio.com/api/webhook/${endpoint.slug}`,
            payload: {
              event: 'order.created',
              data: {
                order_id: '12345',
                customer: 'João Silva',
                total: 150.00,
                status: 'pending'
              }
            }
          },
          {
            name: 'Pedido Pago',
            description: 'Quando um pedido é marcado como pago',
            url: `https://seu-dominio.com/api/webhook/${endpoint.slug}`,
            payload: {
              event: 'order.paid',
              data: {
                order_id: '12345',
                payment_method: 'credit_card',
                paid_at: '2025-09-14T10:30:00Z'
              }
            }
          }
        ]
      },
      'financeiro': {
        title: 'Configuração para Financeiro',
        events: [
          {
            name: 'Pagamento Recebido',
            description: 'Quando um pagamento é confirmado',
            url: `https://seu-dominio.com/api/webhook/${endpoint.slug}`,
            payload: {
              event: 'payment.received',
              data: {
                payment_id: 'PAY-789',
                amount: 500.00,
                currency: 'BRL',
                received_at: '2025-09-14T14:20:00Z'
              }
            }
          }
        ]
      },
      'default': {
        title: 'Configuração Padrão',
        events: [
          {
            name: 'Evento Genérico',
            description: 'Para eventos gerais do sistema',
            url: `https://seu-dominio.com/api/webhook/${endpoint.slug}`,
            payload: {
              event: 'system.notification',
              data: {
                message: 'Evento do sistema',
                timestamp: '2025-09-14T10:00:00Z'
              }
            }
          }
        ]
      }
    };

    return examples[endpoint.slug] || examples['default'];
  };

  const getBestPractices = () => [
    {
      title: 'Segurança',
      items: [
        'Use HTTPS para todas as URLs de webhook',
        'Configure autenticação se necessário',
        'Valide o payload recebido',
        'Use headers de autenticação personalizados'
      ]
    },
    {
      title: 'Performance',
      items: [
        'Configure timeout adequado (recomendado: 5-10 segundos)',
        'Implemente retry automático para falhas temporárias',
        'Monitore logs regularmente',
        'Use filas para processamento assíncrono'
      ]
    },
    {
      title: 'Monitoramento',
      items: [
        'Configure alertas para falhas consecutivas',
        'Monitore tempo de resposta',
        'Acompanhe taxa de sucesso',
        'Revise logs semanalmente'
      ]
    }
  ];

  const getTroubleshootingTips = () => [
    {
      problem: 'Webhook não está sendo recebido',
      solutions: [
        'Verifique se a URL está correta',
        'Confirme se o endpoint está ativo',
        'Teste a conectividade com o destino',
        'Verifique logs do servidor'
      ]
    },
    {
      problem: 'Timeout na entrega',
      solutions: [
        'Aumente o timeout do destino',
        'Verifique a performance da rede',
        'Considere usar filas assíncronas',
        'Otimize o processamento do payload'
      ]
    },
    {
      problem: 'Erro 404 - Endpoint não encontrado',
      solutions: [
        'Verifique se o slug do endpoint está correto',
        'Confirme se o endpoint existe e está ativo',
        'Teste com o endpoint padrão primeiro',
        'Verifique a documentação da API'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="endpoint-docs">
        <div className="loading">Carregando documentação...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="endpoint-docs">
        <div className="error">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="endpoint-docs">
      <div className="docs-header">
        <h2>📚 Documentação dos Endpoints</h2>
        <p>Instruções completas para configurar e usar os endpoints de webhook</p>
      </div>

      <div className="docs-content">
        {/* Endpoint Selection */}
        <div className="endpoint-selector">
          <h3>Selecione um Endpoint</h3>
          <div className="endpoint-tabs">
            {endpoints.map(endpoint => (
              <button
                key={endpoint.id}
                className={`endpoint-tab ${selectedEndpoint?.id === endpoint.id ? 'active' : ''}`}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                {endpoint.name}
                <span className="endpoint-slug">({endpoint.slug})</span>
              </button>
            ))}
          </div>
        </div>

        {selectedEndpoint && (
          <div className="endpoint-details">
            {/* Basic Information */}
            <div className="info-section">
              <h3>📋 Informações do Endpoint</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nome:</label>
                  <span>{selectedEndpoint.name}</span>
                </div>
                <div className="info-item">
                  <label>Slug:</label>
                  <span className="slug">{selectedEndpoint.slug}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status ${selectedEndpoint.active ? 'active' : 'inactive'}`}>
                    {selectedEndpoint.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Descrição:</label>
                  <span>{selectedEndpoint.description || 'Sem descrição'}</span>
                </div>
              </div>
            </div>

            {/* Webhook URL */}
            <div className="url-section">
              <h3>🔗 URL do Webhook</h3>
              <div className="url-container">
                <code className="webhook-url">
                  {config.getBackendUrl()}/api/webhook/{selectedEndpoint.slug}
                </code>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(
                    `${config.getBackendUrl()}/api/webhook/${selectedEndpoint.slug}`,
                    'url'
                  )}
                >
                  {copiedUrl === 'url' ? '✓ Copiado!' : '📋 Copiar'}
                </button>
              </div>
              <p className="url-note">
                URL do webhook para este endpoint
              </p>
            </div>

            {/* TinyERP Examples */}
            <div className="examples-section">
              <h3>⚙️ Exemplos de Configuração - TinyERP</h3>
              {(() => {
                const examples = getTinyERPExamples(selectedEndpoint);
                return (
                  <div className="examples">
                    <h4>{examples.title}</h4>
                    {examples.events.map((event, index) => (
                      <div key={index} className="event-example">
                        <h5>{event.name}</h5>
                        <p>{event.description}</p>
                        <div className="example-code">
                          <div className="code-header">
                            <span>URL:</span>
                            <button
                              className="copy-btn small"
                              onClick={() => copyToClipboard(event.url, `url-${index}`)}
                            >
                              {copiedUrl === `url-${index}` ? '✓' : '📋'}
                            </button>
                          </div>
                          <code>{event.url}</code>
                        </div>
                        <div className="example-code">
                          <div className="code-header">
                            <span>Payload de Exemplo:</span>
                            <button
                              className="copy-btn small"
                              onClick={() => copyToClipboard(JSON.stringify(event.payload, null, 2), `payload-${index}`)}
                            >
                              {copiedUrl === `payload-${index}` ? '✓' : '📋'}
                            </button>
                          </div>
                          <pre><code>{JSON.stringify(event.payload, null, 2)}</code></pre>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Best Practices */}
            <div className="best-practices-section">
              <h3>💡 Melhores Práticas</h3>
              {getBestPractices().map((category, index) => (
                <div key={index} className="practice-category">
                  <h4>{category.title}</h4>
                  <ul>
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Troubleshooting */}
            <div className="troubleshooting-section">
              <h3>🔧 Solução de Problemas</h3>
              {getTroubleshootingTips().map((tip, index) => (
                <div key={index} className="troubleshooting-item">
                  <h4>❓ {tip.problem}</h4>
                  <ul>
                    {tip.solutions.map((solution, solutionIndex) => (
                      <li key={solutionIndex}>{solution}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>⚡ Ações Rápidas</h3>
              <div className="action-buttons">
                <button
                  className="action-btn test"
                  onClick={() => {
                    const testUrl = `https://seu-dominio.com/api/webhook/${selectedEndpoint.slug}`;
                    window.open(testUrl, '_blank');
                  }}
                >
                  🧪 Testar Endpoint
                </button>
                <button
                  className="action-btn copy"
                  onClick={() => copyToClipboard(
                    `curl -X POST https://seu-dominio.com/api/webhook/${selectedEndpoint.slug} -H "Content-Type: application/json" -d '{"test": "webhook"}'`,
                    'curl'
                  )}
                >
                  {copiedUrl === 'curl' ? '✓ Comando Copiado!' : '📋 Copiar Comando cURL'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointDocs;
