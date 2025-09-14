# 🔗 Webhook Redistributor

Um sistema completo para receber webhooks e redistribuí-los para múltiplos destinos, com suporte a endpoints personalizados, interface web moderna e sistema de monitoramento avançado.

## ✨ Funcionalidades

### 🎯 **Redistribuição de Webhooks Multi-Endpoint**
- **Endpoint Padrão**: Recebe webhooks via POST em `/api/webhook`
- **Endpoints Personalizados**: Recebe webhooks via POST em `/api/webhook/:slug`
- Redistribui automaticamente para destinos específicos de cada endpoint
- Headers personalizados para rastreamento
- Timeout configurável (5 segundos)
- Roteamento dinâmico baseado em slug

### 🎛️ **Interface de Gerenciamento Multi-Endpoint**
- **Dashboard**: Visualização completa do sistema com abas por endpoint
- **Gerenciador de Endpoints**: CRUD completo para endpoints personalizados
- **Documentação**: Instruções detalhadas e exemplos de configuração
- **Backup/Restore**: Export e import de configurações completas
- **Configurações**: URL do webhook, toggle global
- **Estatísticas**: Métricas em tempo real por endpoint
- **Logs**: Histórico detalhado de webhooks com filtros por endpoint
- **Teste de Destinos**: Validação individual de endpoints

### 📊 **Monitoramento e Logs**
- Logs detalhados de todos os webhooks recebidos
- Estatísticas de sucesso/erro
- Métricas de performance
- Interface de visualização de logs

### 🛠️ **Gerenciamento de Destinos e Endpoints**
- **Endpoints Personalizados**: Criação e gerenciamento de endpoints com slugs únicos
- **Associação de Destinos**: Vincular destinos a endpoints específicos
- **CRUD Completo**: Para destinos e endpoints
- **Ativar/Desativar**: Controle individual de status
- **Validação**: URLs e slugs únicos
- **Teste de Conectividade**: Validação individual de endpoints
- **Slug Auto-gerado**: Geração automática de slugs a partir do nome

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd replicate-webhook
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie o arquivo .env na raiz do projeto
echo "PORT=3002" > .env
```

### Executando o Sistema

#### Desenvolvimento
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
npm run client
```

#### Produção
```bash
# Backend
npm start

# Frontend (em outro terminal)
cd client && npm start
```

### Acessos
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## 📡 API Endpoints

### Webhooks
- `POST /api/webhook` - Recebe webhooks para redistribuição (endpoint padrão)
- `POST /api/webhook/:slug` - Recebe webhooks para endpoint específico
- `GET /api/webhook/stats` - Estatísticas de uso por endpoint
- `GET /api/webhook/:slug` - Health check de endpoint específico

### Endpoints Personalizados
- `GET /api/endpoints` - Lista todos os endpoints
- `POST /api/endpoints` - Cria novo endpoint
- `PUT /api/endpoints/:id` - Atualiza endpoint
- `DELETE /api/endpoints/:id` - Remove endpoint
- `GET /api/endpoints/:slug/destinations` - Destinos de um endpoint

### Destinos
- `GET /api/destinations` - Lista todos os destinos
- `POST /api/destinations` - Cria novo destino
- `PUT /api/destinations/:id` - Atualiza destino
- `DELETE /api/destinations/:id` - Remove destino

### Logs e Estatísticas
- `GET /api/logs` - Lista logs de webhooks
- `GET /api/logs/stats` - Estatísticas do sistema
- `GET /api/logs/stats/by-endpoint` - Estatísticas agrupadas por endpoint
- `GET /api/logs/endpoint/:slug` - Logs de endpoint específico
- `GET /api/logs/range` - Logs por período

### Backup e Export
- `GET /api/export/config` - Exporta configuração completa
- `POST /api/export/config` - Importa configuração
- `POST /api/export/validate` - Valida arquivo de configuração

## 🗄️ Banco de Dados

O sistema usa SQLite com três tabelas principais:

### `webhook_endpoints`
- `id` - Chave primária
- `name` - Nome do endpoint (ex: "Vendas", "Financeiro")
- `slug` - Slug único para URL (ex: "vendas", "financeiro")
- `description` - Descrição do endpoint
- `active` - Status ativo/inativo
- `created_at` - Data de criação

### `destinations`
- `id` - Chave primária
- `name` - Nome do destino
- `url` - URL do webhook
- `active` - Status ativo/inativo
- `webhook_endpoint_id` - ID do endpoint (NULL = endpoint padrão)
- `created_at` - Data de criação

### `webhook_logs`
- `id` - Chave primária
- `payload` - Payload do webhook (JSON)
- `received_at` - Timestamp de recebimento
- `status` - Código de status HTTP
- `destinations_sent` - Número de destinos
- `error_message` - Mensagem de erro (opcional)
- `endpoint_slug` - Slug do endpoint que recebeu
- `response_time` - Tempo de resposta em ms

## 🎨 Interface do Usuário

### Dashboard Principal
- **Configurações**: URL do webhook, toggle global
- **Estatísticas**: Cards com métricas principais
- **Formulário**: Adicionar novos destinos
- **Lista de Destinos**: Gerenciamento completo
- **Logs**: Histórico de webhooks

### Funcionalidades da Interface
- **Design Responsivo**: Funciona em desktop e mobile
- **Feedback Visual**: Loading states, mensagens de sucesso/erro
- **Validação**: Validação em tempo real de formulários
- **Teste de Destinos**: Botão para testar conectividade
- **Auto-refresh**: Atualização automática de estatísticas

## 🔧 Configuração

### Variáveis de Ambiente
```bash
PORT=3002                    # Porta do backend
NODE_ENV=development         # Ambiente (development/production)
```

### Configurações do Frontend
- Proxy configurado para `http://localhost:3002`
- Auto-refresh de estatísticas a cada 30 segundos
- Retry automático em caso de falhas de conexão

## 🔗 Sistema Multi-Endpoint

### Conceito
O sistema permite criar múltiplos endpoints personalizados, cada um com seus próprios destinos. Isso é útil para organizar webhooks por departamento, função ou sistema.

### Estrutura de URLs
- **Endpoint Padrão**: `https://seu-dominio.com/api/webhook`
- **Endpoints Personalizados**: `https://seu-dominio.com/api/webhook/vendas`
- **Exemplos**: 
  - `/api/webhook/vendas` - Webhooks de vendas
  - `/api/webhook/financeiro` - Webhooks financeiros
  - `/api/webhook/suporte` - Webhooks de suporte

### Configuração de Endpoints
1. **Criar Endpoint**: Use a interface ou API para criar endpoints
2. **Associar Destinos**: Vincule destinos específicos a cada endpoint
3. **Configurar Sistemas**: Configure seus sistemas para enviar para URLs específicas

### Vantagens
- **Organização**: Separação clara por função/departamento
- **Segurança**: Controle granular de acesso
- **Monitoramento**: Estatísticas específicas por endpoint
- **Escalabilidade**: Fácil adição de novos endpoints

## 📝 Exemplos de Uso

### Enviando Webhook para Endpoint Padrão
```bash
curl -X POST http://localhost:3002/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: my-app" \
  -H "X-Webhook-Event: user-created" \
  -d '{
    "user_id": 123,
    "email": "user@example.com",
    "action": "created"
  }'
```

### Enviando Webhook para Endpoint Específico
```bash
# Webhook de vendas
curl -X POST http://localhost:3002/api/webhook/vendas \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-123",
    "amount": 150.00,
    "customer": "João Silva"
  }'

# Webhook financeiro
curl -X POST http://localhost:3002/api/webhook/financeiro \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "PAY-456",
    "amount": 500.00,
    "status": "completed"
  }'
```

### Adicionando um Destino
```bash
curl -X POST http://localhost:3002/api/destinations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook Handler",
    "url": "https://myapp.com/webhook"
  }'
```

### Verificando Estatísticas
```bash
curl http://localhost:3002/api/logs/stats
```

## 🛡️ Segurança

- Validação de URLs nos destinos
- Timeout para evitar travamentos
- Headers personalizados para rastreamento
- Logs detalhados para auditoria
- Validação de entrada em todos os endpoints

## 🔄 Monitoramento

### Métricas Disponíveis
- Total de webhooks processados
- Taxa de sucesso
- Webhooks do dia atual
- Número de destinos ativos
- Tempo de resposta médio

### Logs Detalhados
- Payload completo de cada webhook
- Status de redistribuição
- Tempo de processamento
- Mensagens de erro detalhadas

## 🚨 Troubleshooting

### Problemas Comuns

**Backend não inicia**
- Verifique se a porta 3002 está livre
- Confirme se as dependências estão instaladas
- Verifique os logs de erro

**Frontend não conecta**
- Confirme se o backend está rodando na porta 3002
- Verifique o proxy no `client/package.json`
- Abra o console do navegador para erros

**Webhooks não são redistribuídos**
- Verifique se há destinos ativos
- Confirme se as URLs dos destinos estão corretas
- Use o botão "Testar Destino" para validar

### Logs de Debug
```bash
# Backend logs
npm run dev

# Frontend logs
cd client && npm start
```

## 📚 Estrutura do Projeto

```
replicate-webhook/
├── server/                 # Backend Node.js
│   ├── database/          # Modelos e inicialização do banco
│   ├── routes/            # Rotas da API
│   ├── services/          # Lógica de redistribuição
│   └── app.js            # Servidor principal
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   └── App.js        # App principal
│   └── package.json
├── package.json           # Dependências do backend
└── README.md             # Este arquivo
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Verifique a documentação da API
- Consulte os logs do sistema

---

**Desenvolvido com ❤️ para facilitar a redistribuição de webhooks**
