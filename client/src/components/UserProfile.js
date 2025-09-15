import React, { useState } from 'react';
import api from '../api';
import config from '../config';
import './UserProfile.css';

const UserProfile = ({ user, onLogout }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validações
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await api.put(config.routes.autenticacao + '/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setSuccess('Senha alterada com sucesso!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setShowChangePassword(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(response.data.message || 'Erro ao alterar senha');
      }
    } catch (err) {
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao alterar senha';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>Meu Perfil</h2>
        <div className="user-info">
          <div className="user-avatar">
            {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <h3>{user.nome}</h3>
            <p>{user.email}</p>
            <span className={`role-badge ${user.funcao}`}>
              {user.funcao === 'admin' ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowChangePassword(true)}
        >
          Alterar Senha
        </button>
        <button
          className="btn btn-danger"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>

      {/* Modal Alterar Senha */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Alterar Senha</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowChangePassword(false);
                  setError('');
                  setSuccess('');
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="modal-body">
              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success">
                  {success}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="currentPassword">Senha Atual</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua senha atual"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nova Senha</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua nova senha (mín. 8 caracteres)"
                  required
                  disabled={loading}
                />
                <small className="form-help">
                  A senha deve ter pelo menos 8 caracteres, incluindo letras e números
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirme sua nova senha"
                  required
                  disabled={loading}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setError('');
                    setSuccess('');
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
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
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
