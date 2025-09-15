import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  disabled = false, 
  ariaLabel = "Toggle switch",
  id,
  label
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch" htmlFor={id}>
        <input 
          id={id}
          type="checkbox" 
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
        />
        <span className="toggle-slider"></span>
      </label>
      {label && <span className="toggle-label">{label}</span>}
    </div>
  );
};

export default ToggleSwitch;
