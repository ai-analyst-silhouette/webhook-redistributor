import React from 'react';
import Logs from '../Logs';
import './Logs.css';

const LogsPage = ({ onMessage }) => {
  return (
    <div className="page-logs">
      <Logs onMessage={onMessage} />
    </div>
  );
};

export default LogsPage;
