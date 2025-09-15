import React from 'react';

// Ícones PNG para os botões
export const EditIcon = () => (
  <img 
    src="/icons/editar.png" 
    alt="Editar" 
    className="icon-img"
    onError={(e) => console.log('Erro ao carregar ícone de editar:', e)}
  />
);

export const DeleteIcon = () => (
  <img 
    src="/icons/excluir.png" 
    alt="Excluir" 
    className="icon-img"
    onError={(e) => console.log('Erro ao carregar ícone de excluir:', e)}
  />
);

export const CopyIcon = () => (
  <img
    src="/icons/copiar.png"
    alt="Copiar"
    className="icon-img"
    onError={(e) => console.log('Erro ao carregar ícone de copiar:', e)}
  />
);

export const CloseIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="close-icon"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
};

export const RedirecionarIcon = () => (
  <img
    src="/icons/redirecionar.png"
    alt="Redirecionamentos"
    className="icon-img"
    onError={(e) => console.log('Erro ao carregar ícone de redirecionar:', e)}
  />
);

export const RefreshIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="refresh-icon"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
      <path d="M3 21v-5h5"></path>
    </svg>
  );
};

export const PlusIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="plus-icon"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
};

export const UserIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="user-icon"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
};

export const MailIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mail-icon"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  );
};

export const ShieldIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shield-icon"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
};

export const CalendarIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="calendar-icon"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
};

export const TestTubeIcon = ({ size = 20 }) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'test-tube-icon'
  }, [
    React.createElement('path', { key: '1', d: 'M9 2v6l-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8l-2-2V2' }),
    React.createElement('path', { key: '2', d: 'M9 2h6' }),
    React.createElement('path', { key: '3', d: 'M12 8v4' }),
    React.createElement('path', { key: '4', d: 'M10 14h4' })
  ]);
};