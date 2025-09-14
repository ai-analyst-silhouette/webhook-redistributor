import React, { useState } from 'react';
import api from '../api';
import './QuickSetup.css';

const QuickSetup = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1: Endpoint
    endpointName: '',
    endpointSlug: '',
    endpointDescription: '',
    
    // Step 2: Destinations
    destinations: [
      { name: '', url: '', active: true }
    ],
    
    // Step 3: Test
    testWebhook: false,
    testPayload: '{"message": "Test webhook from Quick Setup", "timestamp": "' + new Date().toISOString() + '"}'
  });

  const steps = [
    { number: 1, title: 'Criar Endpoint', description: 'Configure o endpoint de webhook' },
    { number: 2, title: 'Adicionar Destinos', description: 'Configure os destinos de redistribuição' },
    { number: 3, title: 'Testar Configuração', description: 'Teste o endpoint criado' }
  ];

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate slug when name changes
      if (field === 'endpointName') {
        newData.endpointSlug = generateSlug(value);
      }
      
      return newData;
    });
    
    if (error) setError(null);
  };

  const handleDestinationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.map((dest, i) => 
        i === index ? { ...dest, [field]: value } : dest
      )
    }));
  };

  const addDestination = () => {
    setFormData(prev => ({
      ...prev,
      destinations: [...prev.destinations, { name: '', url: '', active: true }]
    }));
  };

  const removeDestination = (index) => {
    if (formData.destinations.length > 1) {
      setFormData(prev => ({
        ...prev,
        destinations: prev.destinations.filter((_, i) => i !== index)
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.endpointName.trim() && formData.endpointSlug.trim();
      case 2:
        return formData.destinations.every(dest => 
          dest.name.trim() && dest.url.trim() && 
          (() => {
            try {
              new URL(dest.url);
              return true;
            } catch {
              return false;
            }
          })()
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      setError('Por favor, preencha todos os campos obrigatórios');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create endpoint
      const endpointResponse = await api.post('/api/endpoints', {
        name: formData.endpointName,
        slug: formData.endpointSlug,
        description: formData.endpointDescription,
        active: true
      });

      if (!endpointResponse.data.success) {
        throw new Error('Erro ao criar endpoint');
      }

      const endpoint = endpointResponse.data.data;

      // Step 2: Create destinations
      const destinationPromises = formData.destinations.map(dest => 
        api.post('/api/destinations', {
          name: dest.name,
          url: dest.url,
          active: dest.active,
          webhook_endpoint_id: endpoint.id
        })
      );

      const destinationResponses = await Promise.all(destinationPromises);
      const destinations = destinationResponses.map(res => res.data.data);

      // Step 3: Test webhook if requested
      if (formData.testWebhook) {
        try {
          const testPayload = JSON.parse(formData.testPayload);
          await api.post(`/api/webhook/${endpoint.slug}`, testPayload);
        } catch (testError) {
          console.warn('Test webhook failed:', testError);
          // Don't fail the entire setup if test fails
        }
      }

      onComplete && onComplete({
        endpoint,
        destinations,
        webhookUrl: `${window.location.protocol}//${window.location.hostname}:3002/api/webhook/${endpoint.slug}`
      });

    } catch (err) {
      console.error('Quick setup error:', err);
      setError(err.response?.data?.message || 'Erro na configuração rápida');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Configurar Endpoint</h3>
      <p>Configure o endpoint que receberá os webhooks</p>
      
      <div className="form-group">
        <label className="form-label">Nome do Endpoint *</label>
        <input
          type="text"
          value={formData.endpointName}
          onChange={(e) => handleInputChange('endpointName', e.target.value)}
          className="form-control"
          placeholder="Ex: Vendas Online"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Slug (URL) *</label>
        <div className="slug-input-container">
          <input
            type="text"
            value={formData.endpointSlug}
            onChange={(e) => handleInputChange('endpointSlug', e.target.value)}
            className="form-control slug-input"
            placeholder="vendas-online"
          />
          <span className="slug-prefix">/api/webhook/</span>
        </div>
        <div className="form-help">
          URL completa: {window.location.protocol}//{window.location.hostname}:3002/api/webhook/{formData.endpointSlug || 'seu-slug'}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Descrição</label>
        <textarea
          value={formData.endpointDescription}
          onChange={(e) => handleInputChange('endpointDescription', e.target.value)}
          className="form-control"
          placeholder="Descrição opcional do endpoint"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3>Configurar Destinos</h3>
      <p>Adicione os destinos que receberão os webhooks</p>
      
      {formData.destinations.map((dest, index) => (
        <div key={index} className="destination-form">
          <div className="destination-header">
            <h4>Destino {index + 1}</h4>
            {formData.destinations.length > 1 && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removeDestination(index)}
              >
                🗑️ Remover
              </button>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input
                type="text"
                value={dest.name}
                onChange={(e) => handleDestinationChange(index, 'name', e.target.value)}
                className="form-control"
                placeholder="Ex: Sistema de Vendas"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">URL *</label>
              <input
                type="url"
                value={dest.url}
                onChange={(e) => handleDestinationChange(index, 'url', e.target.value)}
                className="form-control"
                placeholder="https://exemplo.com/webhook"
              />
            </div>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        className="btn btn-outline btn-lg"
        onClick={addDestination}
      >
        ➕ Adicionar Destino
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Testar Configuração</h3>
      <p>Teste o endpoint criado enviando um webhook de exemplo</p>
      
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.testWebhook}
            onChange={(e) => handleInputChange('testWebhook', e.target.checked)}
          />
          <span className="checkbox-text">Enviar webhook de teste</span>
        </label>
      </div>

      {formData.testWebhook && (
        <div className="form-group">
          <label className="form-label">Payload de Teste</label>
          <textarea
            value={formData.testPayload}
            onChange={(e) => handleInputChange('testPayload', e.target.value)}
            className="form-control"
            rows={6}
            style={{ fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace' }}
          />
        </div>
      )}

      <div className="setup-summary">
        <h4>Resumo da Configuração</h4>
        <div className="summary-item">
          <strong>Endpoint:</strong> {formData.endpointName} ({formData.endpointSlug})
        </div>
        <div className="summary-item">
          <strong>URL:</strong> {window.location.protocol}//{window.location.hostname}:3002/api/webhook/{formData.endpointSlug}
        </div>
        <div className="summary-item">
          <strong>Destinos:</strong> {formData.destinations.length} configurado(s)
        </div>
      </div>
    </div>
  );

  return (
    <div className="quick-setup">
      <div className="setup-header">
        <h2>⚡ Configuração Rápida</h2>
        <p>Crie um endpoint e configure destinos em poucos passos</p>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          ✕ Cancelar
        </button>
      </div>

      <div className="setup-progress">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
          >
            <div className="step-number">
              {currentStep > step.number ? '✅' : step.number}
            </div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="setup-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <div className="setup-actions">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1 || loading}
        >
          ← Anterior
        </button>
        
        {currentStep < steps.length ? (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!validateStep(currentStep) || loading}
          >
            Próximo →
          </button>
        ) : (
          <button
            className="btn btn-success btn-lg"
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? 'Configurando...' : '✅ Finalizar Configuração'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickSetup;
