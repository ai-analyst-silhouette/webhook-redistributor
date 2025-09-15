import React from 'react';
import Stats from '../Stats';
import './Stats.css';

const StatsPage = ({ onMessage }) => {
  return (
    <div className="page-stats">
      <Stats onMessage={onMessage} />
    </div>
  );
};

export default StatsPage;
