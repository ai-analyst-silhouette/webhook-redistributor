import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import { 
  Dashboard, 
  Redirecionamentos, 
  Stats, 
  Settings, 
  Users
} from './components/pages';

const PagesDemo = () => {
  const [currentView, setCurrentView] = React.useState('redirecionamentos');
  const [user] = React.useState({ funcao: 'ADMIN', nome: 'Admin' });

  const showMessage = (type, text) => {
    console.log(`${type}: ${text}`);
  };

  return (
    <Router>
      <AppLayout 
        pageTitle="Demonstração das Páginas"
        onNavigate={setCurrentView}
        currentView={currentView}
      >
        <div style={{ padding: '20px' }}>
          <h1>🎨 Páginas Adaptadas ao Novo Layout</h1>
          <p>Todas as páginas foram adaptadas para o novo sistema de layout!</p>
          
          <div style={{ marginTop: '20px' }}>
            <h2>Páginas Disponíveis:</h2>
            <ul>
              <li>✅ Dashboard - Visão geral do sistema</li>
              <li>✅ Redirecionamentos - Gerenciar webhooks</li>
              <li>✅ Estatísticas - Métricas e relatórios</li>
              <li>✅ Configurações - Configurações do sistema</li>
              <li>✅ Usuários - Gerenciar usuários</li>
            </ul>
          </div>
        </div>
      </AppLayout>
    </Router>
  );
};

export default PagesDemo;
