import React from 'react';
import RedirecionamentoManager from '../RedirecionamentoManager';
import './Redirecionamentos.css';

const Redirecionamentos = ({ onMessage, user }) => {
  return (
    <div className="page-redirecionamentos">
      <RedirecionamentoManager onMessage={onMessage} user={user} />
    </div>
  );
};

export default Redirecionamentos;
