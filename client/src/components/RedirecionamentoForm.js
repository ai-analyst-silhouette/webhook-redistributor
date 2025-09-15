import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Link, FileText, Hash, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../api';
import config from '../config';
import FloatingInput from './ui/FloatingInput';
import Button from './ui/Button';
import './RedirecionamentoForm.css';

const RedirecionamentoForm = ({ 
  redirecionamento, 
  onRedirecionamentoAdded, 
  onRedirecionamentoUpdated, 
  onCancel 
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

  const isEditing = !!redirecionamento;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nome: redirecionamento.nome || '',
        slug: redirecionamento.slug || '',
        descricao: redirecionamento.descricao || '',
        urls: redirecionamento.urls && redirecionamento.urls.length > 0 
          ? [...redirecionamento.urls] 
          : [''],
        ativo: redirecionamento.ativo !== undefined ? redirecionamento.ativo : true
      });
    } else {
      setFormData({
        nome: '',
        slug: '',
        descricao: '',
        urls: [''],
        ativo: true
      });
    }
  }, [redirecionamento, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
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
      slug: !isEditing ? generateSlug(nome) : prev.slug
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
      const token = localStorage.getItem('authToken') ;
      
      const payload = {
        ...formData,
        urls: formData.urls.filter(url => url.trim())
      };

      let response;
      if (isEditing) {
        response = await api.put(`${config.routes.redirecionamentos}/${redirecionamento.id}`, payload, {
          headers: {
          }
        });
        onRedirecionamentoUpdated(response.data.data);
      } else {
        response = await api.post(config.routes.redirecionamentos, payload, {
          headers: {
          }
        });
        onRedirecionamentoAdded(response.data.data);
      }

    } catch (error) {
      console.error('Erro ao salvar redirecionamento:', error);
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao salvar redirecionamento';
      
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
    <div className="redirecionamento-form">
      <div className="form-header">
        <h3>
          {isEditing ? (
            <>
              <FileText size={20} />
              Editar Redirecionamento
            </>
          ) : (
            <>
              <Plus size={20} />
              Novo Redirecionamento
            </>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <FloatingInput
          id="nome"
          label="Nome do Redirecionamento"
          value={formData.nome}
          onChange={handleNomeChange}
          placeholder="Ex: Webhook de Pagamento"
          error={errors.nome}
          required
          icon={FileText}
        />

        <FloatingInput
          id="slug"
          label="Slug (URL)"
          value={formData.slug}
          onChange={handleInputChange}
          placeholder="Ex: pagamento"
          error={errors.slug}
          required
          icon={Hash}
        />
        <div className="form-help">
          <small>URL do webhook: /api/webhook/{formData.slug}</small>
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
              <FloatingInput
                id={`url-${index}`}
                label={`URL ${index + 1}`}
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://exemplo.com/webhook"
                error={errors[`url-${index}`]}
                icon={Link}
              />
              {formData.urls.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => removeUrl(index)}
                  className="url-remove-btn"
                />
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={addUrl}
            className="add-url-btn"
          >
            Adicionar URL
          </Button>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleInputChange}
              className="checkbox-input"
            />
            <span className="checkbox-custom">
              {formData.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </span>
            <span className="checkbox-text">Redirecionamento ativo</span>
          </label>
        </div>

        {errors.submit && (
          <div className="submit-error">
            <span className="error-icon">⚠️</span>
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="form-actions">
          <Button
            type="button"
            variant="ghost"
            icon={X}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
            className="btn-pulse"
          >
            {isEditing ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RedirecionamentoForm;
