import React, { useState, useEffect } from 'react';
import api from '../api';
import config from '../config';
import IconButton from './ui/IconButton';
import ToggleSwitch from './ui/ToggleSwitch';
import { EditIcon, DeleteIcon, CopyIcon, CloseIcon } from './ui/icons';
import './EditModal.css';

const EditModal = ({ 
  redirecionamento, 
  onClose, 
  onUpdate 
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

  useEffect(() => {
    if (redirecionamento) {
      setFormData({
        nome: redirecionamento.nome || '',
        slug: redirecionamento.slug || '',
        descricao: redirecionamento.descricao || '',
        urls: redirecionamento.urls && redirecionamento.urls.length > 0 
          ? redirecionamento.urls.map(url => typeof url === 'string' ? url : url.url)
          : [''],
        ativo: redirecionamento.ativo !== undefined ? redirecionamento.ativo : true
      });
    }
  }, [redirecionamento]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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

  const handleNomeChange = (e) => {
    const nome = e.target.value;
    setFormData(prev => ({
      ...prev,
      nome,
      slug: generateSlug(nome)
    }));
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
      const token = localStorage.getItem('authToken') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ad2ViaG9vay5sb2NhbCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Nzg3NzA2NiwiZXhwIjoxNzU3OTYzNDY2fQ.wsB9X0lOTehbClmUywzz6BXNeoIi27hoI_FANnnxTcY';
      
      const payload = {
        ...formData,
        urls: formData.urls.filter(url => url.trim())
      };

      const response = await api.put(`${config.routes.redirecionamentos}/${redirecionamento.id}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      onUpdate(response.data.data);
      onClose();

    } catch (error) {
      console.error('Erro ao atualizar redirecionamento:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar redirecionamento';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!redirecionamento) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Redirecionamento</h3>
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
              name="nome"
              value={formData.nome}
              onChange={handleNomeChange}
              placeholder="Ex: Webhook de Pagamento"
              className={`form-input ${errors.nome ? 'error' : ''}`}
              required
            />
            {errors.nome && <span className="error-message">{errors.nome}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="slug" className="form-label">
              Slug (URL) *
            </label>
            <div className="input-with-copy">
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="Ex: pagamento"
                className={`form-input ${errors.slug ? 'error' : ''}`}
                required
              />
              <IconButton
                onClick={() => copyToClipboard(`/api/webhook/${formData.slug}`)}
                title="Copiar URL do webhook"
                type="copy"
              >
                <CopyIcon />
              </IconButton>
            </div>
            <div className="form-help">
              URL do webhook: <code>/api/webhook/{formData.slug}</code>
            </div>
            {errors.slug && <span className="error-message">{errors.slug}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="descricao" className="form-label">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Descrição do redirecionamento"
              rows="3"
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">URLs de Destino *</label>
            {formData.urls.map((url, index) => (
              <div key={index} className="url-input-group">
                <div className="input-with-copy">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://exemplo.com/webhook"
                    className={`form-input ${errors[`url-${index}`] ? 'error' : ''}`}
                  />
                  <IconButton
                    onClick={() => copyToClipboard(url)}
                    title="Copiar URL"
                    type="copy"
                  >
                    <CopyIcon />
                  </IconButton>
                </div>
                {formData.urls.length > 1 && (
                  <IconButton
                    onClick={() => removeUrl(index)}
                    title="Remover URL"
                    type="danger"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
                {errors[`url-${index}`] && (
                  <span className="error-message">{errors[`url-${index}`]}</span>
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
            <div className="toggle-group">
              <ToggleSwitch
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                ariaLabel="Redirecionamento ativo"
              />
              <label htmlFor="ativo" className="toggle-label">
                Redirecionamento ativo
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="submit-error">
              <span className="error-icon">⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
