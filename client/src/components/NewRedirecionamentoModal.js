import React, { useState } from 'react';
import api from '../api';
import config from '../config';
import IconButton from './ui/IconButton';
import ToggleSwitch from './ui/ToggleSwitch';
import { CloseIcon, PlusIcon, CopyIcon } from './ui/icons';
import './NewRedirecionamentoModal.css';

const NewRedirecionamentoModal = ({ 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    urls: [''],
    ativo: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const generateSlug = (nome) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'nome' && value) {
        newData.slug = generateSlug(value);
      }
      
      return newData;
    });
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...formData.urls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, urls: newUrls }));
  };

  const addUrl = () => {
    setFormData(prev => ({
      ...prev,
      urls: [...prev.urls, '']
    }));
  };

  const removeUrl = (index) => {
    if (formData.urls.length > 1) {
      const newUrls = formData.urls.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, urls: newUrls }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório';
    }

    const validUrls = formData.urls.filter(url => url.trim());
    if (validUrls.length === 0) {
      newErrors.urls = 'Pelo menos uma URL é obrigatória';
    }

    // Validar URLs
    validUrls.forEach((url, index) => {
      try {
        new URL(url);
      } catch {
        newErrors[`url_${index}`] = 'URL inválida';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const payload = {
        ...formData,
        urls: formData.urls
          .filter(url => url.trim())
          .map(url => ({ url: url.trim(), ativo: true }))
      };

      const response = await api.post(config.routes.redirecionamentos, payload, {
        headers: {
        }
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao criar redirecionamento:', error);
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao criar redirecionamento';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-redirecionamento-overlay" onClick={onClose}>
      <div className="new-redirecionamento-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Novo Redirecionamento</h3>
          <IconButton
            onClick={onClose}
            title="Fechar"
            type="danger"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="nome" className="form-label">
              Nome do Redirecionamento *
            </label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`form-input ${errors.nome ? 'error' : ''}`}
              placeholder="Ex: Webhook de Pagamentos"
              disabled={loading}
            />
            {errors.nome && <span className="error-message">{errors.nome}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="slug" className="form-label">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className={`form-input ${errors.slug ? 'error' : ''}`}
              placeholder="webhook-pagamentos"
              disabled={loading}
            />
            <p className="form-help">
              URL será: /webhook/{formData.slug || 'slug-gerado'}
            </p>
            {errors.slug && <span className="error-message">{errors.slug}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="descricao" className="form-label">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="form-textarea"
              placeholder="Descrição opcional do redirecionamento"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              URLs de Destino *
            </label>
            {formData.urls.map((url, index) => (
              <div key={index} className="url-input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  className={`form-input ${errors[`url_${index}`] ? 'error' : ''}`}
                  placeholder="https://exemplo.com/webhook"
                  disabled={loading}
                />
                {formData.urls.length > 1 && (
                  <IconButton
                    onClick={() => removeUrl(index)}
                    title="Remover URL"
                    type="danger"
                    disabled={loading}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
                {errors[`url_${index}`] && (
                  <span className="error-message">{errors[`url_${index}`]}</span>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUrl}
              className="add-url-btn"
              disabled={loading}
            >
              <PlusIcon />
              Adicionar URL
            </button>
            {errors.urls && <span className="error-message">{errors.urls}</span>}
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <ToggleSwitch
                id="ativo"
                checked={formData.ativo}
                onChange={(checked) => handleInputChange('ativo', checked)}
                ariaLabel="Ativar redirecionamento"
                disabled={loading}
              />
              <label htmlFor="ativo" className="toggle-label">
                Redirecionamento ativo
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Redirecionamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRedirecionamentoModal;
