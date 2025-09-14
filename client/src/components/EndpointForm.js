import React, { useState, useEffect } from 'react';
import api from '../api';
import './EndpointForm.css';

const EndpointForm = ({ 
  endpoint = null, 
  onSave, 
  onCancel, 
  onError 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (endpoint) {
      setIsEditing(true);
      setFormData({
        name: endpoint.name || '',
        slug: endpoint.slug || '',
        description: endpoint.description || '',
        active: endpoint.active !== false
      });
    } else {
      setIsEditing(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        active: true
      });
    }
    setErrors({});
  }, [endpoint]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-generate slug when name changes (only if not editing or slug is empty)
      if (name === 'name' && (!isEditing || !formData.slug)) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    } else if (formData.slug.length > 100) {
      newErrors.slug = 'Slug deve ter no máximo 100 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        active: formData.active
      };

      let response;
      if (isEditing) {
        response = await api.put(`/api/endpoints/${endpoint.id}`, payload);
      } else {
        response = await api.post('/api/endpoints', payload);
      }

      onSave && onSave(response.data.data);
    } catch (error) {
      console.error('Error saving endpoint:', error);
      
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('slug')) {
          setErrors({ slug: 'Este slug já está em uso' });
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: 'Erro ao salvar endpoint' });
      }
      
      onError && onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewUrl = () => {
    if (!formData.slug) return '';
    return `${window.location.protocol}//${window.location.hostname}:3002/api/webhook/${formData.slug}`;
  };

  return (
    <div className="endpoint-form-container">
      <div className="endpoint-form-header">
        <h2>{isEditing ? 'Editar Endpoint' : 'Novo Endpoint'}</h2>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          ✕ Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="endpoint-form">
        {errors.general && (
          <div className="alert alert-error">
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nome do Endpoint *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`form-control ${errors.name ? 'error' : ''}`}
            placeholder="Ex: Marketing Digital"
            disabled={isLoading}
            maxLength={100}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="slug" className="form-label">
            Slug (URL) *
          </label>
          <div className={`slug-input-container ${errors.slug ? 'error' : ''}`}>
            <span className="slug-prefix">/api/webhook/</span>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="slug-input"
              placeholder="Ex: marketing-digital"
              disabled={isLoading}
              maxLength={100}
            />
          </div>
          {errors.slug && <span className="error-message">{errors.slug}</span>}
          <div className="slug-help">
            O slug será usado na URL do endpoint. Apenas letras minúsculas, números e hífens são permitidos.
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={`form-control ${errors.description ? 'error' : ''}`}
            placeholder="Descrição opcional do endpoint"
            disabled={isLoading}
            maxLength={500}
            rows={3}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
          <div className="char-count">
            {formData.description.length}/500 caracteres
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <span className="checkbox-text">Endpoint ativo</span>
          </label>
          <div className="checkbox-help">
            Endpoints inativos não receberão webhooks
          </div>
        </div>

        {formData.slug && (
          <div className="form-group">
            <label className="form-label">Preview da URL:</label>
            <div className="url-preview">
              <code>{getPreviewUrl()}</code>
              <button
                type="button"
                className="btn btn-sm btn-outline copy-url-btn"
                onClick={() => {
                  navigator.clipboard.writeText(getPreviewUrl()).then(() => {
                    onError && onError('URL copiada para a área de transferência!');
                  });
                }}
              >
                📋 Copiar
              </button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !formData.name.trim() || !formData.slug.trim()}
          >
            {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EndpointForm;
