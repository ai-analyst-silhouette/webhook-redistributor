import React from 'react';
import logoImage from '../../assets/logo_retangular.png';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-content-text">
            <img 
              src={logoImage} 
              alt="SilhOuette eXPerts" 
              className="footer-logo-image"
            />
            <div className="footer-text">
              Desenvolvido com <span className="heart">❤️</span> por <strong>Daniel Junior</strong> © {currentYear}
            </div>
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-links">
            <a href="/privacy" className="footer-link">
              Privacidade
            </a>
            <a href="/terms" className="footer-link">
              Termos
            </a>
            <a href="/support" className="footer-link">
              Suporte
            </a>
          </div>
          
          <div className="footer-status">
            <span className="status-indicator online"></span>
            <span className="status-text">Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
