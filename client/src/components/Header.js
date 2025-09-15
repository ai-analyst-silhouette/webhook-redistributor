import React, { useState } from 'react';
import './Header.css';
import './PermissionWrapper.css';

const Header = ({ user, onLogout, onShowProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      // Limpar dados do localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Notificar componente pai
      onLogout();
    }
    setShowDropdown(false);
  };

  const handleProfile = () => {
    onShowProfile();
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🔗</span>
            <span className="logo-text">Webhook Redistributor</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-menu">
            <button
              className="user-button"
              onClick={toggleDropdown}
              onBlur={() => setTimeout(closeDropdown, 200)}
            >
              <div className="user-avatar">
                {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.nome || 'Usuário'}</span>
                <div className="permission-indicator">
                  <div className={`icon ${user?.funcao === 'admin' ? 'admin' : 'user'}`}></div>
                  <span className="user-role">
                    {user?.funcao === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                  <span className={`permission-badge ${user?.funcao === 'admin' ? 'admin' : 'user'}`}>
                    {user?.funcao === 'admin' ? 'ADMIN' : 'USER'}
                  </span>
                </div>
              </div>
              <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>
                ▼
              </span>
            </button>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="dropdown-name">{user?.nome || 'Usuário'}</div>
                      <div className="dropdown-email">{user?.email || ''}</div>
                    </div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button
                  className="dropdown-item"
                  onClick={handleProfile}
                >
                  <span className="dropdown-icon">👤</span>
                  Meu Perfil
                </button>
                
                <button
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <span className="dropdown-icon">🚪</span>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
