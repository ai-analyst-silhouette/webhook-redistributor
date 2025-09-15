import React, { useState } from 'react';
import api from '../api';
import ToggleSwitch from './ui/ToggleSwitch';
import IconButton from './ui/IconButton';
import { EditIcon, DeleteIcon, UserIcon, MailIcon, ShieldIcon, CalendarIcon } from './ui/icons';
import './UserCard.css';

const UserCard = ({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  actionLoading,
  currentUser
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleToggleStatus = async () => {
    if (actionLoading[user.id]) return;
    
    try {
      await onToggleStatus(user.id, !user.ativo);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(user.id);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit(user);
  };


  return (
    <div className="user-card">
      <div className="card-header">
        <div className="card-title">
          <h3>{user.nome}</h3>
          <div className="card-status">
            <ToggleSwitch
              id={`user-toggle-${user.id}`}
              checked={user.ativo}
              onChange={handleToggleStatus}
              disabled={actionLoading[user.id]}
              ariaLabel={`Ativar/desativar usuário ${user.nome}`}
            />
            <span className="status-label">
              {user.ativo ? 'Ativado' : 'Clique para ativar'}
            </span>
          </div>
        </div>
        <div className="card-actions">
          <IconButton
            onClick={handleEdit}
            disabled={actionLoading[user.id]}
            title="Editar usuário"
            variant="secondary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={handleDelete}
            disabled={actionLoading[user.id] || isDeleting || user.id === currentUser?.id}
            title={user.id === currentUser?.id ? "Não é possível excluir seu próprio usuário" : "Excluir usuário"}
            variant="danger"
          >
            <DeleteIcon />
          </IconButton>
        </div>
      </div>

      <div className="card-content">
        <div className="user-info">
          <div className="user-avatar">
            <UserIcon className="avatar-icon" />
          </div>
          <div className="user-details">
            <div className="user-email">
              <MailIcon className="icon" />
              {user.email}
            </div>
            <div className="user-role">
              <ShieldIcon className="icon" />
              {user.funcao === 'admin' ? 'Administrador' : 'Usuário'}
            </div>
            <div className="user-last-login">
              <CalendarIcon className="icon" />
              Último login: {formatDate(user.ultimo_login)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
