import React from 'react';
import AppLayout from '../Layout/AppLayout';
import './HeaderTest.css';

const HeaderTest = () => {
  return (
    <AppLayout pageTitle="Teste do Header">
      <div className="header-test-page">
        <div className="test-section">
          <h2>🎨 Teste do Header - SilhOuette eXPerts</h2>
          <p>Este é um teste do header implementado com:</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🏢</span>
              <div className="feature-content">
                <h3>Logo da Empresa</h3>
                <p>Logo SilhOuette eXPerts com gradiente cyan/magenta</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🌙</span>
              <div className="feature-content">
                <h3>Toggle de Tema</h3>
                <p>Botão para alternar entre tema claro e escuro</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">👤</span>
              <div className="feature-content">
                <h3>Menu do Usuário</h3>
                <p>Avatar com iniciais e dropdown de opções</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <div className="feature-content">
                <h3>Design Responsivo</h3>
                <p>Funciona perfeitamente em desktop, tablet e mobile</p>
              </div>
            </div>
          </div>
          
          <div className="test-actions">
            <button className="test-button primary">
              Testar Tema
            </button>
            <button className="test-button secondary">
              Testar Menu
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HeaderTest;
