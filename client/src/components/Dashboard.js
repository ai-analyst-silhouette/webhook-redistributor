import React from 'react';
import RedirecionamentoManager from './RedirecionamentoManager';
import Stats from './Stats';
import Settings from './Settings';
import './Dashboard.css';

const Dashboard = ({ currentView = 'redirecionamentos', onMessage, user }) => {
  const showMessage = (type, text) => {
    // Apenas notificar o componente pai (App.js)
    if (onMessage) {
      onMessage(type, text);
    }
  };

  return (
    <div className="dashboard">
      {/* Redirecionamentos View */}
      {currentView === 'redirecionamentos' && (
        <RedirecionamentoManager onMessage={showMessage} user={user} />
      )}


      {/* Stats View */}
      {currentView === 'stats' && (
        <Stats onMessage={showMessage} />
      )}

      {/* Settings View */}
      {currentView === 'settings' && (
        <Settings />
      )}
    </div>
  );
};

export default Dashboard;
