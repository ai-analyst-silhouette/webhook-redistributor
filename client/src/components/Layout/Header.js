import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import logoImage from '../../assets/logo_retangular.png';
import './Header.css';

const Header = ({ currentPageTitle = 'Dashboard' }) => {
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  // Fechar dropdown ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleUserMenuToggle = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleUserMenuClose = () => {
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleProfile = () => {
    // Implementar navegação para perfil
    console.log('Navegar para perfil');
    handleUserMenuClose();
  };

  const handleSettings = () => {
    // Implementar navegação para configurações
    console.log('Navegar para configurações');
    handleUserMenuClose();
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (!user) return 'Usuário';
    return user.nome || user.username || 'Usuário';
  };

  const getUserEmail = () => {
    if (!user) return 'usuario@webhook.local';
    return user.email || 'usuario@webhook.local';
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <a href="/" className="app-logo">
          <img 
            src={logoImage} 
            alt="SilhOuette eXPerts" 
            className="logo-image"
          />
        </a>
      </div>

      <div className="header-center">
        <h1 className="page-title">{currentPageTitle}</h1>
      </div>

      <div className="header-right">
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          <div className="theme-icon">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39.39 1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41z"/>
              </svg>
            )}
          </div>
        </button>

        <div className="user-menu">
          <button 
            className="user-button"
            onClick={handleUserMenuToggle}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <div 
              className="user-avatar"
              style={{ color: '#ffffff' }}
            >
              {getUserInitials(getUserDisplayName())}
            </div>
            <span className="user-name">
              {getUserDisplayName()}
            </span>
            <ChevronDown 
              size={16} 
              className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`} 
            />
          </button>

          {userMenuOpen && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar-large">
                  {getUserInitials(getUserDisplayName())}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{getUserDisplayName()}</div>
                  <div className="user-email">{getUserEmail()}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleProfile}>
                <User size={18} className="dropdown-icon" />
                Meu Perfil
              </button>
              <button className="dropdown-item" onClick={handleSettings}>
                <Settings size={18} className="dropdown-icon" />
                Configurações
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogOut size={18} className="dropdown-icon" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {userMenuOpen && (
        <div 
          className="user-menu-overlay"
          onClick={handleUserMenuClose}
        />
      )}
    </header>
  );
};

export default Header;
