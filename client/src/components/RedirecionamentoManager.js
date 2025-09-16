import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import config from '../config';
import EditModal from './EditModal';
import DeleteModal from './DeleteModal';
import NewRedirecionamentoModal from './NewRedirecionamentoModal';
import RedirecionamentoCard from './RedirecionamentoCard';
import TestResultModal from './TestResultModal';
import PermissionWrapper from './PermissionWrapper';
import { RedirecionarIcon, RefreshIcon, PlusIcon } from './ui/icons';
import './RedirecionamentoManager.css';

const RedirecionamentoManager = ({ onMessage, user, onRef }) => {
  const [redirecionamentos, setRedirecionamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [editingRedirecionamento, setEditingRedirecionamento] = useState(null);
  const [deletingRedirecionamento, setDeletingRedirecionamento] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    fetchRedirecionamentos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Expor métodos para o componente pai
  useEffect(() => {
    if (onRef) {
      onRef({
        openNewModal: () => setShowNewModal(true)
      });
    }
  }, [onRef]);

  const fetchRedirecionamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(config.routes.redirecionamentos);
      
      if (response.data.success) {
        // Debug: ver o que vem do backend
        console.log('Backend response:', response.data.data);
        
        // Converter destinos para URLs para compatibilidade com UI atual, mas manter destinos originais
        const redirecionamentosCompativeis = response.data.data.map(red => {
          console.log('Convertendo redirecionamento:', red);
          console.log('red.destinos:', red.destinos);
          
          const urls = red.destinos ? red.destinos.map(destino => destino.url) : [];
          console.log('URLs convertidas:', urls);
          
          return {
            ...red,
            urls,
            destinos: red.destinos || [] // Manter destinos para acesso aos IDs
          };
        });
        
        setRedirecionamentos(redirecionamentosCompativeis);
        if (!hasLoadedRef.current) {
          onMessage('success', 'Redirecionamentos carregados com sucesso!');
          hasLoadedRef.current = true;
        }
      } else {
        throw new Error('Falha ao carregar redirecionamentos');
      }
    } catch (err) {
      console.error('Erro ao carregar redirecionamentos:', err);
      
      // Se for erro de autenticação, não mostrar erro, apenas deixar o interceptor lidar
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Erro de autenticação ao carregar redirecionamentos');
        return;
      }
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao conectar com o servidor';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      onMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirecionamentoAdded = (newRedirecionamento) => {
    // Converter destinos para URLs para compatibilidade com UI atual, mas manter destinos originais
    const redirecionamentoCompativel = {
      ...newRedirecionamento,
      urls: newRedirecionamento.destinos ? newRedirecionamento.destinos.map(destino => destino.url) : [],
      destinos: newRedirecionamento.destinos || [] // Manter destinos para acesso aos IDs
    };
    
    setRedirecionamentos(prev => [redirecionamentoCompativel, ...prev]);
    onMessage('success', 'Redirecionamento criado com sucesso!');
  };

  const handleRedirecionamentoUpdated = (updatedRedirecionamento) => {
    // Converter destinos para URLs para compatibilidade com UI atual, mas manter destinos originais
    const redirecionamentoCompativel = {
      ...updatedRedirecionamento,
      urls: updatedRedirecionamento.destinos ? updatedRedirecionamento.destinos.map(destino => destino.url) : [],
      destinos: updatedRedirecionamento.destinos || [] // Manter destinos para acesso aos IDs
    };
    
    setRedirecionamentos(prev => 
      prev.map(red => 
        red.id === updatedRedirecionamento.id 
          ? redirecionamentoCompativel 
          : red
      )
    );
    setEditingRedirecionamento(null);
    onMessage('success', 'Redirecionamento atualizado com sucesso!');
  };

  const handleEdit = (redirecionamento) => {
    setEditingRedirecionamento(redirecionamento);
  };

  const handleCancelEdit = () => {
    setEditingRedirecionamento(null);
  };

  const toggleRedirecionamentoStatus = async (id, currentStatus) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const url = `${config.routes.redirecionamentos}/${id}/toggle`;
      console.log('Toggle URL:', url);
      console.log('Full URL:', `${config.apiUrl}${url}`);
      
      const response = await api.patch(url, {
        ativo: !currentStatus
      }, {
        headers: {
        }
      });
      
      if (response.data.success) {
        setRedirecionamentos(prev => 
          prev.map(red => 
            red.id === id 
              ? { ...red, ativo: !currentStatus }
              : red
          )
        );
        onMessage('success', `Redirecionamento ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        throw new Error(response.data.message || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao alterar status do redirecionamento:', error);
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao alterar status';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onMessage('error', errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteClick = (redirecionamento) => {
    setDeletingRedirecionamento(redirecionamento);
  };

  const handleDeleteConfirm = async (redirecionamento) => {
    const { id, nome } = redirecionamento;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.delete(`${config.routes.redirecionamentos}/${id}`, {
        headers: {
        }
      });
      
      if (response.data.success) {
        setRedirecionamentos(prev => prev.filter(red => red.id !== id));
        onMessage('success', 'Redirecionamento removido com sucesso!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao remover redirecionamento:', error);
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao remover redirecionamento';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onMessage('error', errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeletingRedirecionamento(null);
  };

  const handleNewRedirecionamento = () => {
    setShowNewModal(true);
  };

  const handleCloseNewModal = () => {
    setShowNewModal(false);
  };

  const handleNewRedirecionamentoSuccess = (newRedirecionamento) => {
    setRedirecionamentos(prev => [newRedirecionamento, ...prev]);
    onMessage('success', 'Redirecionamento criado com sucesso!');
  };

  const testRedirecionamento = async (id) => {
    setActionLoading(prev => ({ ...prev, [`test-${id}`]: true }));
    
    try {
      const token = localStorage.getItem('authToken') ;
      
      const response = await api.post(`${config.routes.redirecionamentos}/${id}/testar`, {
        payload: {
          teste: 'webhook de teste',
          timestamp: new Date().toISOString(),
          source: 'interface-web'
        }
      }, {
        headers: {
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        const results = data.results || [];
        const statistics = data.statistics || {};
        
        console.log('Resultados do teste:', data);
        
        // Armazenar resultados e mostrar modal
        setTestResults(data);
        setShowTestResults(true);
        
        // Mostrar estatísticas gerais na notificação
        const successMessage = `Teste concluído: ${statistics.successful || 0}/${statistics.total || 0} destinos funcionando (${statistics.successRate || 0}% sucesso)`;
        onMessage('success', successMessage);
      } else {
        throw new Error(response.data.message || 'Resposta de sucesso inválida');
      }
    } catch (error) {
      console.error('Erro ao testar redirecionamento:', error);
      
      // Usar mensagem específica do backend
      let errorMessage = 'Erro ao testar redirecionamento';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Se for erro específico de backend, tentar mostrar mais detalhes
      if (error.response?.status) {
        errorMessage += ` (HTTP ${error.response.status})`;
      }
      
      onMessage('error', errorMessage);
      
      // Log completo para debug
      console.error('Erro completo:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`test-${id}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="redirecionamento-manager">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando redirecionamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="redirecionamento-manager">
        <div className="error">
          <h2>⚠️ Erro</h2>
          <p>{error}</p>
          <button onClick={fetchRedirecionamentos} className="retry-button">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="redirecionamento-manager">
      <div className="section-header">
        <h2 className="page-title">
          <RedirecionarIcon />
          Redirecionamentos ({redirecionamentos.length})
        </h2>
        <div className="header-actions">
          <button 
            onClick={fetchRedirecionamentos} 
            className="btn btn-secondary"
          >
            <RefreshIcon />
            Atualizar
          </button>
          <PermissionWrapper 
            permission="criar_redirecionamento" 
            user={user}
            fallback={
              <button 
                className="btn btn-primary permission-disabled"
                title="Você não tem permissão para criar redirecionamentos"
                disabled
              >
                <PlusIcon />
                Novo Redirecionamento
              </button>
            }
          >
            <button 
              onClick={handleNewRedirecionamento} 
              className="btn btn-primary"
            >
              <PlusIcon />
              Novo Redirecionamento
            </button>
          </PermissionWrapper>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingRedirecionamento && (
        <EditModal
          redirecionamento={editingRedirecionamento}
          onClose={handleCancelEdit}
          onUpdate={handleRedirecionamentoUpdated}
        />
      )}

      {/* Modal de Exclusão */}
      {deletingRedirecionamento && (
        <DeleteModal
          redirecionamento={deletingRedirecionamento}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Modal de Novo Redirecionamento */}
      {showNewModal && (
        <NewRedirecionamentoModal
          onClose={handleCloseNewModal}
          onSuccess={handleNewRedirecionamentoSuccess}
        />
      )}

      {/* Lista de Redirecionamentos */}
      {redirecionamentos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum redirecionamento configurado ainda.</p>
          <p>Clique em "Novo Redirecionamento" para começar.</p>
        </div>
      ) : (
        <div className="redirecionamentos-grid">
          {redirecionamentos.map((redirecionamento) => (
            <RedirecionamentoCard
              key={redirecionamento.id}
              redirecionamento={redirecionamento}
              onEdit={handleEdit}
              onToggleStatus={toggleRedirecionamentoStatus}
              onDelete={handleDeleteClick}
              onTest={testRedirecionamento}
              actionLoading={actionLoading}
              user={user}
            />
          ))}
        </div>
      )}

      {/* Modal de Resultados de Teste */}
      <TestResultModal
        isOpen={showTestResults}
        onClose={() => {
          setShowTestResults(false);
          setTestResults(null);
        }}
        testResults={testResults}
      />
    </div>
  );
};

export default RedirecionamentoManager;
