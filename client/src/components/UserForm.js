import React, { useState, useEffect } from 'react';
import api from '../api';
import config from '../config';
import './UserForm.css';

const UserForm = ({ 
  user, 
  onUserAdded, 
  onUserUpdated, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!user;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: user.funcao || 'user'
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
    }
  }, [user, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    } else {
      // Na edição, senha é opcional
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Tipo de usuário é obrigatório';
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
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        role: formData.role
      };

      // Incluir senha apenas se fornecida
      if (formData.password) {
        payload.password = formData.password;
      }

      let response;
      if (isEditing) {
        response = await api.put(`${config.routes.autenticacao}/users/${user.id}`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        onUserUpdated(response.data.data);
      } else {
        response = await api.post(`${config.routes.autenticacao}/users`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        onUserAdded(response.data.data);
      }

    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar usuário';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form">
      <div className="form-header">
        <h3>{isEditing ? '✏️ Editar Usuário' : '➕ Novo Usuário'}</h3>
        <button 
          type="button" 
          onClick={onCancel}
          className="btn btn-secondary"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        {errors.submit && (
          <div className="alert alert-error">
            {errors.submit}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="nome">Nome *</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Digite o nome completo"
            className={errors.nome ? 'error' : ''}
            disabled={loading}
          />
          {errors.nome && <span className="error-message">{errors.nome}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">E-mail *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Digite o e-mail"
            className={errors.email ? 'error' : ''}
            disabled={loading}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Senha {isEditing ? '(deixe em branco para manter a atual)' : '*'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={isEditing ? 'Digite nova senha (opcional)' : 'Digite a senha'}
            className={errors.password ? 'error' : ''}
            disabled={loading}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            Confirmar Senha {isEditing ? '(deixe em branco para manter a atual)' : '*'}
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={isEditing ? 'Confirme a nova senha (opcional)' : 'Confirme a senha'}
            className={errors.confirmPassword ? 'error' : ''}
            disabled={loading}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="role">Tipo de Usuário *</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className={errors.role ? 'error' : ''}
            disabled={loading}
          >
            <option value="">Selecione o tipo</option>
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
          {errors.role && <span className="error-message">{errors.role}</span>}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
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
            {loading ? (
              <>
                <span className="spinner"></span>
                {isEditing ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Criar Usuário'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
