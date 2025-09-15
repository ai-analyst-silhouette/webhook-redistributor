import React from 'react';
import Settings from '../Settings';
import './Settings.css';

const SettingsPage = ({ onSettingsChange }) => {
  return (
    <div className="page-settings">
      <Settings onSettingsChange={onSettingsChange} />
    </div>
  );
};

export default SettingsPage;
