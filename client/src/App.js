import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AppLayout from './components/Layout/AppLayout';
import { 
  Dashboard, 
  Redirecionamentos, 
  NewRedirecionamento,
  Stats, 
  Settings, 
  Users,
  Logs
} from './components/pages';
import UserProfile from './components/UserProfile';
import HelpPage from './components/HelpPage';
import PermissionWrapper from './components/PermissionWrapper';
import ToastContainer from './components/ui/ToastContainer';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('redirecionamentos');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNewRedirecionamento, setShowNewRedirecionamento] = useState(false);
  const [redirecionamentoManagerRef, setRedirecionamentoManagerRef] = useState(null);

  // Função para validar se o token JWT ainda é válido
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      // Decodificar o payload do JWT (sem verificar assinatura)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verificar se o token não expirou
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    }
  };

  useEffect(() => {
    // Verificar se há token válido no localStorage
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData && isTokenValid(token)) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        // Limpar dados inválidos
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else if (token && !isTokenValid(token)) {
      // Token expirado, limpar dados
      console.log('Token expirado, redirecionando para login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    
    setLoading(false);
  }, []);

  // Listener global para erros de autenticação
  useEffect(() => {
    const handleAuthError = () => {
      console.log('Erro de autenticação detectado globalmente, redirecionando para login...');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    };

    // Adicionar listener para eventos de erro de autenticação
    window.addEventListener('authError', handleAuthError);
    
    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setMessage({ type: 'success', text: 'Login realizado com sucesso!' });
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('redirecionamentos');
    setMessage({ type: 'info', text: 'Logout realizado com sucesso!' });
    // Limpar dados do localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleNewRedirecionamento = () => {
    setCurrentView('novo-redirecionamento');
  };

  const getPageTitle = (view) => {
    const titles = {
      'redirecionamentos': 'Redirecionamentos',
      'novo-redirecionamento': 'Novo Redirecionamento',
      'stats': 'Estatísticas',
      'settings': 'Configurações',
      'usuarios': 'Usuários',
      'logs': 'Logs',
      'help': 'Ajuda',
      'dashboard': 'Dashboard'
    };
    return titles[view] || 'Dashboard';
  };

  const renderContent = () => {
    switch (currentView) {
      case 'redirecionamentos':
        return <Redirecionamentos onMessage={showMessage} user={user} onRef={setRedirecionamentoManagerRef} />;
      case 'novo-redirecionamento':
        return <NewRedirecionamento onMessage={showMessage} user={user} onBack={() => setCurrentView('redirecionamentos')} />;
      case 'stats':
        return <Stats onMessage={showMessage} isVisible={currentView === 'stats'} />;
      case 'settings':
        return <Settings />;
      case 'usuarios':
        return <Users onMessage={showMessage} user={user} />;
      case 'logs':
        return <Logs onMessage={showMessage} user={user} />;
      case 'help':
        return <HelpPage onBack={() => setCurrentView('redirecionamentos')} />;
      default:
        return <Dashboard currentView={currentView} onMessage={showMessage} user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <ToastContainer />
        {!isAuthenticated ? (
          <Login onLogin={handleLogin} />
        ) : (
          <AppLayout 
            pageTitle={getPageTitle(currentView)}
            onNavigate={setCurrentView}
            currentView={currentView}
            onNewRedirecionamento={handleNewRedirecionamento}
          >
            {/* Message Display */}
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Main Content */}
            {showProfile ? (
              <div>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowProfile(false)}
                  style={{ marginBottom: '20px' }}
                >
                  ← Voltar ao Dashboard
                </button>
                <UserProfile 
                  user={user} 
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              renderContent()
            )}
          </AppLayout>
        )}
      </div>
    </Router>
  );
}

export default App;
