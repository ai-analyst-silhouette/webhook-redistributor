import React, { useState } from 'react';
import { 
  Home, 
  Link, 
  ArrowRight, 
  Users, 
  BarChart3, 
  HelpCircle,
  Settings, 
  BookOpen, 
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import './HelpPage.css';

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Visão Geral', icon: () => <Home size={20} /> },
    { id: 'webhooks', title: 'Webhooks', icon: () => <Link size={20} /> },
    { id: 'redirecionamentos', title: 'Redirecionamentos', icon: () => <ArrowRight size={20} /> },
    { id: 'usuarios', title: 'Usuários', icon: () => <Users size={20} /> },
    { id: 'logs', title: 'Logs', icon: () => <BarChart3 size={20} /> },
    { id: 'faq', title: 'FAQ', icon: () => <HelpCircle size={20} /> },
    { id: 'tinyerp', title: 'TinyERP', icon: () => <Settings size={20} /> }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="help-content">
            <div className="help-header">
              <h2>
                <Home size={24} />
                Visão Geral do Sistema
              </h2>
              <p>O <strong>Webhook Redistributor</strong> é uma ferramenta poderosa para gerenciar e redistribuir webhooks de forma eficiente e segura.</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <ArrowRight size={24} />
                </div>
                <div className="feature-content">
                  <h3>Redirecionamentos</h3>
                  <p>Crie e gerencie redirecionamentos de webhooks</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Link size={24} />
                </div>
                <div className="feature-content">
                  <h3>Múltiplos Destinos</h3>
                  <p>Envie o mesmo webhook para várias URLs</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="feature-content">
                  <h3>Logs Detalhados</h3>
                  <p>Acompanhe todas as requisições e respostas</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <BookOpen size={24} />
                </div>
                <div className="feature-content">
                  <h3>Estatísticas</h3>
                  <p>Monitore o desempenho do sistema</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Users size={24} />
                </div>
                <div className="feature-content">
                  <h3>Controle de Acesso</h3>
                  <p>Gerencie usuários e permissões</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="feature-content">
                  <h3>Segurança</h3>
                  <p>Autenticação e auditoria completas</p>
                </div>
              </div>
            </div>

            <div className="getting-started">
              <h3>
                <ChevronRight size={20} />
                Como Começar
              </h3>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Crie um novo redirecionamento</h4>
                    <p>Acesse a aba "Redirecionamentos" e clique em "Novo"</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Configure as URLs de destino</h4>
                    <p>Adicione as URLs que receberão os webhooks</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Teste o webhook</h4>
                    <p>Use a URL gerada para testar o funcionamento</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Monitore os logs</h4>
                    <p>Acompanhe o desempenho na aba "Logs"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'webhooks':
        return (
          <div className="help-content">
            <h2>🔗 Webhooks</h2>
            <p>Webhooks são notificações HTTP enviadas por sistemas externos quando eventos específicos ocorrem.</p>
            
            <h3>Como Funciona:</h3>
            <ol>
              <li>Sistema externo envia webhook para nossa URL</li>
              <li>Nós recebemos e processamos o webhook</li>
              <li>Redistribuímos para todas as URLs configuradas</li>
              <li>Registramos logs de todas as operações</li>
            </ol>

            <h3>URL do Webhook:</h3>
            <code className="code-block">
              https://seu-dominio.com/api/webhook/{'{slug}'}
            </code>

            <h3>Exemplo de Uso:</h3>
            <pre className="code-block">
{`curl -X POST https://seu-dominio.com/api/webhook/pagamentos \\
  -H "Content-Type: application/json" \\
  -d '{
    "evento": "pagamento_aprovado",
    "valor": 100.50,
    "cliente": "João Silva"
  }'`}
            </pre>

            <h3>Headers Automáticos:</h3>
            <ul>
              <li><code>X-Redistributed-At:</code> Timestamp da redistribuição</li>
              <li><code>X-Redistributed-From:</code> Identificação do sistema</li>
              <li><code>User-Agent:</code> Webhook-Redistributor/1.0</li>
            </ul>
          </div>
        );

      case 'redirecionamentos':
        return (
          <div className="help-content">
            <h2>↗️ Redirecionamentos</h2>
            <p>Redirecionamentos são configurações que definem para onde os webhooks devem ser enviados.</p>
            
            <h3>Criando um Redirecionamento:</h3>
            <ol>
              <li>Clique em "Novo Redirecionamento"</li>
              <li>Preencha o nome e slug</li>
              <li>Adicione URLs de destino</li>
              <li>Salve a configuração</li>
            </ol>

            <h3>Campos Obrigatórios:</h3>
            <ul>
              <li><strong>Nome:</strong> Nome descritivo do redirecionamento</li>
              <li><strong>Slug:</strong> Identificador único (apenas letras, números e hífens)</li>
              <li><strong>URLs:</strong> Pelo menos uma URL de destino</li>
            </ul>

            <h3>Exemplo de Slug:</h3>
            <ul>
              <li>✅ <code>pagamentos</code></li>
              <li>✅ <code>webhook-pagamentos</code></li>
              <li>✅ <code>notificacoes-vendas</code></li>
              <li>❌ <code>Webhook Pagamentos</code> (espaços não permitidos)</li>
              <li>❌ <code>webhook@pagamentos</code> (caracteres especiais não permitidos)</li>
            </ul>

            <h3>Status dos Destinos:</h3>
            <ul>
              <li>🟢 <strong>Online:</strong> Endpoint respondendo normalmente</li>
              <li>🔴 <strong>Offline:</strong> Endpoint não está respondendo</li>
              <li>⚪ <strong>Desconhecido:</strong> Status não verificado</li>
            </ul>
          </div>
        );

      case 'usuarios':
        return (
          <div className="help-content">
            <h2>👥 Gerenciamento de Usuários</h2>
            <p>O sistema possui dois tipos de usuários com diferentes permissões.</p>
            
            <h3>Tipos de Usuário:</h3>
            <div className="user-types">
              <div className="user-type">
                <h4>👑 Administrador</h4>
                <ul>
                  <li>Criar, editar e excluir redirecionamentos</li>
                  <li>Gerenciar usuários</li>
                  <li>Visualizar logs e estatísticas</li>
                  <li>Exportar dados</li>
                  <li>Acessar todas as funcionalidades</li>
                </ul>
              </div>
              <div className="user-type">
                <h4>👤 Usuário</h4>
                <ul>
                  <li>Visualizar redirecionamentos</li>
                  <li>Testar redirecionamentos</li>
                  <li>Visualizar logs e estatísticas</li>
                  <li>Alterar própria senha</li>
                </ul>
              </div>
            </div>

            <h3>Segurança:</h3>
            <ul>
              <li>Senhas devem ter pelo menos 8 caracteres</li>
              <li>Senhas devem conter letras e números</li>
              <li>Sessão expira em 8 horas (ou 30 dias com "Lembrar de mim")</li>
              <li>Bloqueio temporário após 5 tentativas de login incorretas</li>
              <li>Todas as ações são registradas em logs de auditoria</li>
            </ul>

            <h3>Recuperação de Senha:</h3>
            <p>Se você esqueceu sua senha:</p>
            <ol>
              <li>Clique em "Esqueci minha senha" na tela de login</li>
              <li>Digite seu email</li>
              <li>Uma nova senha temporária será gerada</li>
              <li>Faça login com a senha temporária</li>
              <li>Altere para uma nova senha no seu perfil</li>
            </ol>
          </div>
        );

      case 'logs':
        return (
          <div className="help-content">
            <h2>📊 Logs e Monitoramento</h2>
            <p>O sistema registra todas as atividades para facilitar o monitoramento e debugging.</p>
            
            <h3>Tipos de Log:</h3>
            <ul>
              <li><strong>Webhook Logs:</strong> Todas as requisições recebidas e redistribuídas</li>
              <li><strong>Audit Logs:</strong> Ações dos usuários no sistema</li>
              <li><strong>Error Logs:</strong> Erros e falhas do sistema</li>
            </ul>

            <h3>Informações dos Logs:</h3>
            <ul>
              <li><strong>Timestamp:</strong> Data e hora da operação</li>
              <li><strong>Status:</strong> Código de resposta HTTP</li>
              <li><strong>Tempo de Resposta:</strong> Duração da operação</li>
              <li><strong>Payload:</strong> Dados enviados/recebidos</li>
              <li><strong>IP:</strong> Endereço de origem</li>
              <li><strong>User-Agent:</strong> Identificação do cliente</li>
            </ul>

            <h3>Filtros Disponíveis:</h3>
            <ul>
              <li>Por redirecionamento</li>
              <li>Por status (sucesso/erro)</li>
              <li>Por período de tempo</li>
              <li>Por usuário (logs de auditoria)</li>
            </ul>

            <h3>Exportação:</h3>
            <p>Os logs podem ser exportados em formato JSON para análise externa.</p>
          </div>
        );

      case 'faq':
        return (
          <div className="help-content">
            <h2>❓ Perguntas Frequentes</h2>
            
            <div className="faq-item">
              <h3>Como criar um webhook no TinyERP?</h3>
              <p>No TinyERP, vá em Configurações → Integrações → Webhooks e configure a URL do redirecionamento.</p>
            </div>

            <div className="faq-item">
              <h3>Posso usar o mesmo redirecionamento para diferentes sistemas?</h3>
              <p>Sim! Um redirecionamento pode ter múltiplas URLs de destino. O webhook será enviado para todas elas.</p>
            </div>

            <div className="faq-item">
              <h3>O que acontece se uma URL de destino estiver offline?</h3>
              <p>O sistema tentará enviar para todas as URLs. As que estiverem offline falharão, mas as outras receberão o webhook normalmente.</p>
            </div>

            <div className="faq-item">
              <h3>Como saber se um webhook foi recebido com sucesso?</h3>
              <p>Verifique os logs do sistema. Lá você verá o status de cada redistribuição e o tempo de resposta.</p>
            </div>

            <div className="faq-item">
              <h3>Posso alterar as URLs de destino depois de criar o redirecionamento?</h3>
              <p>Sim! Você pode editar o redirecionamento a qualquer momento para adicionar, remover ou alterar URLs.</p>
            </div>

            <div className="faq-item">
              <h3>O sistema é seguro?</h3>
              <p>Sim! Utilizamos autenticação JWT, criptografia de senhas, rate limiting e logs de auditoria completos.</p>
            </div>

            <div className="faq-item">
              <h3>Posso integrar com outros sistemas além do TinyERP?</h3>
              <p>Sim! O sistema funciona com qualquer sistema que envie webhooks HTTP. Basta configurar a URL correta.</p>
            </div>
          </div>
        );

      case 'tinyerp':
        return (
          <div className="help-content">
            <h2>⚙️ Integração com TinyERP</h2>
            <p>Guia completo para configurar webhooks no TinyERP.</p>
            
            <h3>Passo a Passo:</h3>
            <ol>
              <li><strong>No TinyERP:</strong>
                <ul>
                  <li>Acesse Configurações → Integrações</li>
                  <li>Clique em "Webhooks"</li>
                  <li>Clique em "Novo Webhook"</li>
                </ul>
              </li>
              <li><strong>Configure o Webhook:</strong>
                <ul>
                  <li>Nome: "Redistribuidor de Webhooks"</li>
                  <li>URL: <code>https://seu-dominio.com/api/webhook/tinyerp</code></li>
                  <li>Eventos: Selecione os eventos desejados</li>
                  <li>Método: POST</li>
                </ul>
              </li>
              <li><strong>No Redistribuidor:</strong>
                <ul>
                  <li>Crie um redirecionamento com slug "tinyerp"</li>
                  <li>Adicione as URLs de destino</li>
                  <li>Teste a integração</li>
                </ul>
              </li>
            </ol>

            <h3>Eventos Recomendados:</h3>
            <ul>
              <li><strong>Vendas:</strong> Quando uma venda é criada/atualizada</li>
              <li><strong>Clientes:</strong> Quando um cliente é criado/atualizado</li>
              <li><strong>Produtos:</strong> Quando um produto é criado/atualizado</li>
              <li><strong>Estoque:</strong> Quando o estoque é alterado</li>
            </ul>

            <h3>Exemplo de Payload:</h3>
            <pre className="code-block">
{`{
  "evento": "venda_criada",
  "id": 12345,
  "cliente": {
    "nome": "João Silva",
    "email": "joao@email.com"
  },
  "produtos": [
    {
      "nome": "Produto A",
      "quantidade": 2,
      "valor": 50.00
    }
  ],
  "total": 100.00,
  "data": "2024-01-15T10:30:00Z"
}`}
            </pre>

            <h3>Dicas Importantes:</h3>
            <ul>
              <li>Teste sempre a integração antes de usar em produção</li>
              <li>Monitore os logs para identificar problemas</li>
              <li>Configure URLs de destino confiáveis</li>
              <li>Use HTTPS para maior segurança</li>
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="help-page">
      <div className="help-container">
        <div className="section-header">
          <div className="page-title">
            <img 
              src="/icons/help.png" 
              alt="Ajuda" 
              className="icon-img"
              onError={(e) => console.log('Erro ao carregar ícone de ajuda:', e)}
            />
            <h2>Central de Ajuda</h2>
          </div>
        </div>

        <div className="help-layout">
          <div className="help-sidebar">
            <nav className="help-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`help-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="nav-icon">{section.icon()}</span>
                  <span className="nav-title">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="help-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
