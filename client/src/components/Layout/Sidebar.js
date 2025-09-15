import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Sidebar.css';

// Importar ícones da pasta assets
import redirecionarIcon from '../../assets/icons/redirecionar.png';
import logsIcon from '../../assets/icons/logs.png';
import estatisticaIcon from '../../assets/icons/estatistica.png';
import configIcon from '../../assets/icons/config.png';
import helpIcon from '../../assets/icons/help.png';
import usersIcon from '../../assets/icons/users.png';

// Função para verificar se é um ícone de texto
const isTextIcon = (icon) => {
  return typeof icon === 'string' && !icon.includes('.png') && !icon.includes('.jpg') && !icon.includes('.svg') && !icon.startsWith('data:') && !icon.startsWith('http');
};

const Sidebar = ({ onNavigate, currentView, onNewRedirecionamento }) => {
  const { sidebarOpen, closeSidebar, toggleSidebar } = useTheme();
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);


  // Carregar dados do usuário
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

  const navigationItems = [
    {
      id: 'redirecionamentos',
      label: 'Redirecionamentos',
      icon: redirecionarIcon,
      view: 'redirecionamentos',
      description: 'Gerenciar webhooks'
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: logsIcon,
      view: 'logs',
      description: 'Histórico de atividades'
    },
    {
      id: 'stats',
      label: 'Estatísticas',
      icon: estatisticaIcon,
      view: 'stats',
      description: 'Métricas e relatórios'
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: usersIcon,
      view: 'usuarios',
      description: 'Gerenciar usuários',
      adminOnly: true
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: configIcon,
      view: 'settings',
      description: 'Configurações do sistema'
    }
  ];

  const helpItems = [
    {
      id: 'ajuda',
      label: 'Ajuda',
      icon: helpIcon,
      view: 'help',
      description: 'Central de ajuda'
    }
  ];

  const handleNavigation = (view) => {
    if (onNavigate) {
      onNavigate(view);
    }
    closeSidebar();
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
    
    // Ajustar o conteúdo após a animação
    setTimeout(() => {
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('sidebarToggle', { 
        detail: { collapsed: !collapsed } 
      }));
    }, 300); // Aguardar a animação do CSS
  };

  const handleHelpToggle = () => {
    if (onNavigate) {
      onNavigate('help');
    }
    closeSidebar();
  };

  const isActive = (view) => {
    return currentView === view;
  };

  const hasPermission = (item) => {
    if (!item.adminOnly) return true;
    if (!user) return false;
    return user.funcao === 'admin';
  };

  const filteredNavigationItems = navigationItems.filter(hasPermission);

  return (
    <>
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-content">
          {/* Botão de colapsar e título Principal - div separada */}
          <div className="sidebar-toggle-section">
            {!collapsed && <div className="sidebar-section-title">Principal</div>}
            <button 
              className="sidebar-toggle-btn"
              onClick={handleToggleCollapse}
              title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              <span className={`toggle-arrow ${collapsed ? 'collapsed' : ''}`}>
                {collapsed ? '→' : '←'}
              </span>
            </button>
          </div>

          {/* Botão Principal - Novo */}
          <div className="sidebar-section">
            <nav className="sidebar-nav">
              <li className="sidebar-nav-item">
                <button
                  className="sidebar-nav-link sidebar-action-btn"
                  onClick={() => {
                    if (onNewRedirecionamento) {
                      onNewRedirecionamento();
                    } else {
                      handleNavigation('redirecionamentos');
                    }
                  }}
                  title={collapsed ? 'Criar novo redirecionamento' : undefined}
                  aria-label="Criar novo redirecionamento"
                >
                  <span className="sidebar-nav-icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="sidebar-icon-svg"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </span>
                  {!collapsed && (
                    <span className="sidebar-nav-label">Novo</span>
                  )}
                </button>
              </li>
            </nav>
          </div>

          {/* Navegação */}
          <div className="sidebar-section">
            <nav className="sidebar-nav">
              {filteredNavigationItems.map((item) => (
                <li key={item.id} className="sidebar-nav-item">
                  <button
                    className={`sidebar-nav-link ${isActive(item.view) ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.view)}
                    title={collapsed ? item.description : undefined}
                    aria-label={`Navegar para ${item.label}`}
                  >
                    <span className="sidebar-nav-icon">
                      {isTextIcon(item.icon) ? (
                        item.icon
                      ) : (
                        <img src={item.icon} alt={item.label} className="sidebar-icon-img" onError={(e) => console.log('Erro ao carregar imagem:', item.icon, e)} />
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="sidebar-nav-label">{item.label}</span>
                        {item.adminOnly && (
                          <span className="admin-badge">ADMIN</span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              ))}
            </nav>
          </div>

          {/* Ajuda e Suporte */}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">Ajuda</div>}
            <nav className="sidebar-nav">
              {helpItems.map((item) => (
                <li key={item.id} className="sidebar-nav-item">
                  <button
                    className={`sidebar-nav-link ${isActive(item.view) ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.view)}
                    title={collapsed ? item.description : undefined}
                    aria-label={`Navegar para ${item.label}`}
                  >
                    <span className="sidebar-nav-icon">
                      {isTextIcon(item.icon) ? (
                        item.icon
                      ) : (
                        <img src={item.icon} alt={item.label} className="sidebar-icon-img" onError={(e) => console.log('Erro ao carregar imagem:', item.icon, e)} />
                      )}
                    </span>
                    {!collapsed && (
                      <span className="sidebar-nav-label">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </nav>
          </div>

          {/* Informações do Sistema */}
          {!collapsed && (
            <div className="sidebar-footer">
              <div className="system-info">
                <div className="system-status">
                  <span className="status-indicator online"></span>
                  <span className="status-text">Sistema Online</span>
                </div>
                <div className="system-version">
                  v1.0.0
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
