import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import './Select.css';

const Select = ({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção',
  searchable = false,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const searchRef = useRef(null);

  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (option) => {
    onChange && onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className={`select-container ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="select-wrapper" ref={selectRef}>
        <button
          type="button"
          className={`select-trigger ${isOpen ? 'open' : ''}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${id}-label`}
        >
          <div className="select-content">
            {selectedOption ? (
              <span className="select-value">{selectedOption.label}</span>
            ) : (
              <span className="select-placeholder">{placeholder}</span>
            )}
          </div>
          <ChevronDown 
            size={16} 
            className={`select-arrow ${isOpen ? 'open' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="select-dropdown">
            {searchable && (
              <div className="select-search">
                <Search size={16} className="search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="search-input"
                />
              </div>
            )}
            
            <div className="select-options">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`select-option ${index === highlightedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="option-label">{option.label}</span>
                    {option.value === value && (
                      <Check size={16} className="option-check" />
                    )}
                  </button>
                ))
              ) : (
                <div className="select-empty">
                  Nenhuma opção encontrada
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {label && (
        <label id={`${id}-label`} className="select-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      {error && (
        <div className="select-error">
          <span className="error-icon">⚠</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

export default Select;
