import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import config from '../../config';
import ToggleSwitch from '../ui/ToggleSwitch';
import './NewRedirecionamento.css';

const NewRedirecionamento = ({ onMessage, user, onBack }) => {
  const navigate = useNavigate();
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
      
      if (field === 'nome') {
        newData.slug = value ? generateSlug(value) : '';
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
    setFormData(prev => ({
      ...prev,
      urls: newUrls
    }));
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
      setFormData(prev => ({
        ...prev,
        urls: newUrls
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    }
    
    const validUrls = formData.urls.filter(url => url.trim());
    if (validUrls.length === 0) {
      newErrors.urls = 'Pelo menos uma URL é obrigatória';
    } else {
      validUrls.forEach((url, index) => {
        try {
          new URL(url);
        } catch {
          newErrors[`url-${index}`] = 'URL inválida';
        }
      });
    }
    
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
      // Converter URLs para formato de destinos (igual ao EditModal)
      const destinos = formData.urls
        .filter(url => url.trim())
        .map((url, index) => ({
          nome: `Destino ${index + 1}`,
          url: url.trim(),
          ativo: true,
          ordem: index,
          timeout: 5000,
          max_tentativas: 3
        }));

      const redirecionamentoData = {
        ...formData,
        destinos
      };
      
      await api.post(config.routes.redirecionamentos, redirecionamentoData);
      onMessage('success', 'Redirecionamento criado com sucesso!');
      
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Erro ao criar redirecionamento:', error);
      onMessage('error', 'Erro ao criar redirecionamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-redirecionamento-page">
      <div className="page-header">
        <h1>Novo Redirecionamento</h1>
        <p>Crie um novo redirecionamento de webhook</p>
      </div>
      
      <div className="page-content">
        <form onSubmit={handleSubmit} className="redirecionamento-form">
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
              placeholder="Ex: Webhook de Pagamento"
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
              placeholder="Ex: webhook-pagamento"
            />
            <span className="form-help">
              URL amigável para o redirecionamento
            </span>
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
              placeholder="Descreva o propósito deste redirecionamento"
              rows="3"
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
                  className="form-input"
                  placeholder="https://exemplo.com/webhook"
                />
                {formData.urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(index)}
                    className="remove-url-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUrl}
              className="add-url-btn"
            >
              + Adicionar URL
            </button>
            {errors.urls && <span className="error-message">{errors.urls}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Status do Redirecionamento
            </label>
            <div className="toggle-container">
              <ToggleSwitch
                checked={formData.ativo}
                onChange={(checked) => handleInputChange('ativo', checked)}
                label="Redirecionamento Ativo"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onBack}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Criando...' : 'Criar Redirecionamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRedirecionamento;
