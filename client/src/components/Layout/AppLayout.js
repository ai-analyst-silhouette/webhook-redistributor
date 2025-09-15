import React, { useState } from 'react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './AppLayout.css';

const AppLayoutContent = ({ children, pageTitle = 'Dashboard', onNavigate, currentView, onNewRedirecionamento }) => {
  const { sidebarOpen } = useTheme();

  return (
    <div className="app-layout">
      <Header currentPageTitle={pageTitle} />
      <Sidebar onNavigate={onNavigate} currentView={currentView} onNewRedirecionamento={onNewRedirecionamento} />
      <main className={`app-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="main-content">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const AppLayout = ({ children, pageTitle = 'Dashboard', onNavigate, currentView, onNewRedirecionamento }) => {
  return (
    <ThemeProvider>
      <AppLayoutContent 
        pageTitle={pageTitle} 
        onNavigate={onNavigate} 
        currentView={currentView}
        onNewRedirecionamento={onNewRedirecionamento}
      >
        {children}
      </AppLayoutContent>
    </ThemeProvider>
  );
};

export default AppLayout;
