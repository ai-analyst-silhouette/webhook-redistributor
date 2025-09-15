import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import api from '../api';
import config from '../config';
import UserForm from './UserForm';
import UserCard from './UserCard';
import PermissionWrapper from './PermissionWrapper';
import { RefreshIcon, PlusIcon } from './ui/icons';
import usersIcon from '../assets/icons/users.png';
import './UserManager.css';

const UserManager = ({ onMessage, user: currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.get(config.routes.autenticacao + '/users', {
        headers: {
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
        }
      } else {
        throw new Error('Falha ao carregar usuários');
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao conectar com o servidor';
      setError(errorMessage);
      onMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingUser(null);
    setShowForm(false);
  };

  const handleUserAdded = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
    setShowForm(false);
    onMessage('success', 'Usuário criado com sucesso!');
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setShowForm(false);
    onMessage('success', 'Usuário atualizado com sucesso!');
  };

  const toggleUserStatus = async (id, currentStatus) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.put(`${config.routes.autenticacao}/users/${id}/status`, {
        ativo: !currentStatus
      }, {
        headers: {
        }
      });
      
      if (response.data.success) {
        setUsers(prev => 
          prev.map(user => 
            user.id === id 
              ? { ...user, ativo: !currentStatus }
              : user
          )
        );
        onMessage('success', `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        throw new Error(response.data.message || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao alterar status';
      onMessage('error', errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteUser = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${nome}"?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.delete(`${config.routes.autenticacao}/users/${id}`, {
        headers: {
        }
      });
      
      if (response.data.success) {
        setUsers(prev => prev.filter(user => user.id !== id));
        onMessage('success', 'Usuário removido com sucesso!');
      } else {
        throw new Error(response.data.message || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover usuário';
      onMessage('error', errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (ativo) => {
    return ativo ? (
      <span className="status-badge status-active">Ativo</span>
    ) : (
      <span className="status-badge status-inactive">Inativo</span>
    );
  };

  const getRoleBadge = (funcao) => {
    return funcao === 'admin' ? (
      <span className="role-badge role-admin">Administrador</span>
    ) : (
      <span className="role-badge role-user">Usuário</span>
    );
  };

  if (loading) {
    return (
      <div className="user-manager">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-manager">
        <div className="error">
          <h2>⚠️ Erro</h2>
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-manager">
      <div className="section-header">
        <div className="page-title">
          <img 
            src={usersIcon} 
            alt="Usuários" 
            className="icon-img"
          />
          <h2>Gerenciar Usuários ({users.length})</h2>
        </div>
        <div className="header-actions">
          <button 
            onClick={fetchUsers} 
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshIcon className="icon" />
            Atualizar
          </button>
          <PermissionWrapper 
            permission="gerenciar_usuarios" 
            user={currentUser}
            fallback={
              <button 
                className="btn btn-primary permission-disabled"
                title="Você não tem permissão para criar usuários"
                disabled
              >
                <PlusIcon className="icon" />
                Novo Usuário
              </button>
            }
          >
            <button 
              onClick={handleNewUser} 
              className="btn btn-primary"
            >
              <PlusIcon className="icon" />
              Novo Usuário
            </button>
          </PermissionWrapper>
        </div>
      </div>

      {/* Formulário de Criação/Edição */}
      {showForm && (
        <div 
          className="form-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelForm();
            }
          }}
        >
          <div className="form-card">
            <UserForm
              user={editingUser}
              onUserAdded={handleUserAdded}
              onUserUpdated={handleUserUpdated}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Users size={48} />
          </div>
          <h3>Nenhum usuário cadastrado</h3>
          <p>Comece criando seu primeiro usuário do sistema.</p>
          <PermissionWrapper 
            permission="gerenciar_usuarios" 
            user={currentUser}
            fallback={null}
          >
            <button 
              onClick={handleNewUser} 
              className="btn btn-primary"
            >
              <PlusIcon className="icon" />
              Criar Primeiro Usuário
            </button>
          </PermissionWrapper>
        </div>
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEditUser}
              onDelete={(userId) => deleteUser(userId, user.nome)}
              onToggleStatus={(userId, newStatus) => toggleUserStatus(userId, !newStatus)}
              actionLoading={actionLoading}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManager;
