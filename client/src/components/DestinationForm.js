import React, { useState, useEffect } from 'react';
import api from '../api';
import './DestinationForm.css';

const DestinationForm = ({ onDestinationAdded, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    webhook_endpoint_id: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [endpoints, setEndpoints] = useState([]);
  const [loadingEndpoints, setLoadingEndpoints] = useState(true);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoadingEndpoints(true);
      const response = await api.get('/api/endpoints');
      
      if (response.data.success) {
        setEndpoints(response.data.data);
        // Set default endpoint as selected
        const defaultEndpoint = response.data.data.find(ep => ep.slug === 'default');
        if (defaultEndpoint) {
          setFormData(prev => ({
            ...prev,
            webhook_endpoint_id: defaultEndpoint.id
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      onError && onError('Erro ao carregar endpoints');
    } finally {
      setLoadingEndpoints(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL é obrigatória';
    } else {
      try {
        new URL(formData.url);
      } catch (error) {
        newErrors.url = 'URL inválida';
      }
    }

    if (!formData.webhook_endpoint_id) {
      newErrors.webhook_endpoint_id = 'Endpoint é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value) || null : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post('/api/destinations', formData);
      
      if (response.data.success) {
        // Reset form
        setFormData({ 
          name: '', 
          url: '', 
          webhook_endpoint_id: endpoints.find(ep => ep.slug === 'default')?.id || null 
        });
        
        // Notify parent component
        if (onDestinationAdded) {
          onDestinationAdded(response.data.data);
        }
        
        // Show success message (you could add a toast notification here)
        console.log('Destination created successfully:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Erro ao criar destino');
      }
    } catch (error) {
      console.error('Error creating destination:', error);
      
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Erro ao conectar com o servidor' });
      }
      
      if (onError) {
        onError(error.response?.data?.message || 'Erro ao criar destino');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="destination-form">
      <h3>➕ Adicionar Novo Destino</h3>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nome do Destino *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: Webhook de Produção"
            className={`form-control ${errors.name ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.name && <span className="text-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="url" className="form-label">URL do Webhook *</label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            placeholder="https://exemplo.com/webhook"
            className={`form-control ${errors.url ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.url && <span className="text-error">{errors.url}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="webhook_endpoint_id" className="form-label">Endpoint de Webhook *</label>
          {loadingEndpoints ? (
            <div className="form-control loading">
              <span>Carregando endpoints...</span>
            </div>
          ) : (
            <select
              id="webhook_endpoint_id"
              name="webhook_endpoint_id"
              value={formData.webhook_endpoint_id || ''}
              onChange={handleInputChange}
              className={`form-control ${errors.webhook_endpoint_id ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">Selecione um endpoint</option>
              {endpoints.map(endpoint => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name} ({endpoint.slug})
                  {endpoint.slug === 'default' ? ' - Padrão' : ''}
                </option>
              ))}
            </select>
          )}
          {errors.webhook_endpoint_id && <span className="text-error">{errors.webhook_endpoint_id}</span>}
          <div className="form-help">
            Escolha qual endpoint de webhook este destino irá usar
          </div>
        </div>

        {errors.general && (
          <div className="alert alert-error">
            {errors.general}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary btn-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Adicionando...
            </>
          ) : (
            'Adicionar Destino'
          )}
        </button>
      </form>
    </div>
  );
};

export default DestinationForm;
