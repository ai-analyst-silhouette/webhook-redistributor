import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import { Dashboard, Redirecionamentos } from './components/pages';

const SidebarDemo = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <AppLayout pageTitle="Dashboard">
            <Dashboard />
          </AppLayout>
        } />
        <Route path="/redirecionamentos" element={
          <AppLayout pageTitle="Redirecionamentos">
            <Redirecionamentos />
          </AppLayout>
        } />
        <Route path="/logs" element={
        } />
        <Route path="/stats" element={
          <AppLayout pageTitle="Estatísticas">
            <div className="page-content">
              <h1>📈 Estatísticas</h1>
              <p>Página de estatísticas em desenvolvimento...</p>
            </div>
          </AppLayout>
        } />
        <Route path="/usuarios" element={
          <AppLayout pageTitle="Usuários">
            <div className="page-content">
              <h1>👥 Usuários</h1>
              <p>Página de usuários em desenvolvimento...</p>
            </div>
          </AppLayout>
        } />
        <Route path="/configuracoes" element={
          <AppLayout pageTitle="Configurações">
            <div className="page-content">
              <h1>⚙️ Configurações</h1>
              <p>Página de configurações em desenvolvimento...</p>
            </div>
          </AppLayout>
        } />
        <Route path="/ajuda" element={
          <AppLayout pageTitle="Ajuda">
            <div className="page-content">
              <h1>📚 Ajuda</h1>
              <p>Central de ajuda em desenvolvimento...</p>
            </div>
          </AppLayout>
        } />
        <Route path="/documentacao" element={
          <AppLayout pageTitle="Documentação">
            <div className="page-content">
              <h1>📖 Documentação</h1>
              <p>Documentação técnica em desenvolvimento...</p>
            </div>
          </AppLayout>
        } />
      </Routes>
    </Router>
  );
};

export default SidebarDemo;
