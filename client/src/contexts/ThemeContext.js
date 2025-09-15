import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Verificar se há tema salvo no localStorage, senão usar dark como padrão
    const savedTheme = localStorage.getItem('webhook-theme');
    return savedTheme || 'dark';
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Verificar se há preferência de sidebar salva
    const savedSidebar = localStorage.getItem('webhook-sidebar-open');
    return savedSidebar ? JSON.parse(savedSidebar) : true;
  });

  // Aplicar tema ao documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('webhook-theme', theme);
  }, [theme]);

  // Aplicar tema escuro imediatamente no carregamento
  useEffect(() => {
    if (!localStorage.getItem('webhook-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Salvar estado da sidebar
  useEffect(() => {
    localStorage.setItem('webhook-sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const value = {
    theme,
    sidebarOpen,
    toggleTheme,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
