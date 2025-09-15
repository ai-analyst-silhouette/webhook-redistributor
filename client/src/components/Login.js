import React, { useState } from 'react';
import { Eye, EyeOff, Loader, MessageCircle } from 'lucide-react';
import api from '../api';
import config from '../config';
import logoImage from '../assets/logo_retangular.png';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(config.routes.autenticacao + '/login', formData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Converter campos para o formato esperado pelo frontend
        const userData = {
          id: user.id,
          nome: user.name,
          email: user.email,
          funcao: user.role
        };
        
        
        // Armazenar token e dados do usuário
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Notificar componente pai sobre o login
        onLogin(userData);
      } else {
        setError(response.data.message || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      
      // Verificar se é erro de credenciais inválidas
      if (err.response?.status === 401) {
        setError('Email ou senha incorretos');
      } else if (err.response?.status === 403) {
        setError('Acesso negado. Verifique suas credenciais');
      } else if (err.response?.status === 429) {
        setError('Muitas tentativas de login. Tente novamente em 15 minutos');
      } else if (err.response?.data?.error) {
        // Usar a mensagem de erro específica do backend
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erro ao conectar com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src={logoImage} alt="SilhOuette eXPerts" className="logo-image" />
          </div>
          <h1>Webhook Redistributor</h1>
          <p>Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Digite seu e-mail"
              required
              disabled={loading}
              className="clean-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                required
                disabled={loading}
                className="clean-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Lembrar de mim (30 dias)
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button clean-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="rotate" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <div className="login-footer">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="forgot-password-link"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>

        {/* Modal Esqueci Minha Senha */}
        {showForgotPassword && (
          <div className="forgot-password-modal">
            <div className="forgot-password-content">
              <div className="forgot-password-header">
                <h3>Esqueci Minha Senha</h3>
                <button 
                  className="forgot-password-close"
                  onClick={() => setShowForgotPassword(false)}
                >
                  ×
                </button>
              </div>
              <div className="forgot-password-body">
                <div className="forgot-password-icon">
                  <MessageCircle size={48} />
                </div>
                <h4>Precisa de ajuda para recuperar sua senha?</h4>
                <p>Para alterar sua senha, entre em contato conosco pelo email:</p>
                <div className="contact-email">
                  <strong>ia@silhouetteexperts.com.br</strong>
                </div>
                <p>Nossa equipe de suporte irá ajudá-lo a recuperar o acesso à sua conta.</p>
              </div>
              <div className="forgot-password-footer">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="forgot-password-btn"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
