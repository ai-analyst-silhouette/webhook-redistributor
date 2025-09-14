# 🚀 Deploy Docker Swarm + Traefik

## 📋 Pré-requisitos

1. **Docker Swarm** configurado
2. **Traefik** rodando no cluster
3. **Portainer** (opcional, para interface gráfica)
4. **DNS** configurado para os subdomínios:
   - `redistribuidor-back.silhouetteexperts.com.br` → Backend
   - `redistribuidor-front.silhouetteexperts.com.br` → Frontend

## 🔧 Configuração do Traefik

### 1. Verificar se o Traefik está configurado com:
- **Let's Encrypt** para SSL automático
- **Docker Swarm** provider habilitado
- **Rede externa** `webhook_network` criada

### 2. Configuração no Portainer:
```yaml
# Labels do Traefik (já configuradas no docker-compose.yml)
- "traefik.enable=true"
- "traefik.docker.network=webhook_network"
- "traefik.http.routers.webhook-backend.rule=Host(`redistribuidor-back.silhouetteexperts.com.br`)"
- "traefik.http.routers.webhook-backend.entrypoints=websecure"
- "traefik.http.routers.webhook-backend.tls.certresolver=letsencrypt"
```

## 🚀 Deploy

### Opção 1: Script Automático
```bash
./deploy.sh
```

### Opção 2: Manual
```bash
# 1. Criar rede (se não existir)
docker network create --driver overlay webhook_network

# 2. Build das imagens
docker build -t webhook-redistributor-backend:latest ./server
docker build -t webhook-redistributor-frontend:latest ./client

# 3. Deploy do stack
docker stack deploy -c docker-compose.yml webhook-redistributor
```

### Opção 3: Via Portainer
1. Acesse o Portainer
2. Vá em **Stacks** → **Add Stack**
3. Cole o conteúdo do `docker-compose.yml`
4. Configure as variáveis de ambiente
5. Deploy

## 🔍 Verificação

### 1. Status dos Serviços
```bash
docker service ls | grep webhook
```

### 2. Logs
```bash
# Backend
docker service logs -f webhook-redistributor_webhook-backend

# Frontend
docker service logs -f webhook-redistributor_webhook-frontend
```

### 3. Teste de Conectividade
```bash
# Backend
curl -k https://redistribuidor-back.silhouetteexperts.com.br/health

# Frontend
curl -k https://redistribuidor-front.silhouetteexperts.com.br
```

## 🌐 URLs de Acesso

- **Frontend**: https://redistribuidor-front.silhouetteexperts.com.br
- **Backend API**: https://redistribuidor-back.silhouetteexperts.com.br
- **Health Check**: https://redistribuidor-back.silhouetteexperts.com.br/health
- **Traefik Dashboard**: http://seu-servidor:8080

## 🔧 Configuração de DNS

### Registros DNS necessários:
```
redistribuidor-back.silhouetteexperts.com.br    A    IP_DO_SERVIDOR
redistribuidor-front.silhouetteexperts.com.br   A    IP_DO_SERVIDOR
```

## 📊 Monitoramento

### 1. Logs em Tempo Real
```bash
docker service logs -f webhook-redistributor_webhook-backend
```

### 2. Métricas do Traefik
- Acesse: http://seu-servidor:8080
- Vá em **HTTP** → **Services**

### 3. Health Checks
```bash
# Backend
curl -k https://redistribuidor-back.silhouetteexperts.com.br/health

# Frontend
curl -k https://redistribuidor-front.silhouetteexperts.com.br/health
```

## 🛠️ Troubleshooting

### Problema: Serviços não sobem
```bash
# Verificar logs
docker service logs webhook-redistributor_webhook-backend

# Verificar rede
docker network ls | grep webhook
```

### Problema: SSL não funciona
1. Verificar se o Let's Encrypt está configurado
2. Verificar se os DNS estão apontando corretamente
3. Verificar logs do Traefik

### Problema: Frontend não conecta no Backend
1. Verificar se a variável `REACT_APP_API_URL` está configurada
2. Verificar se o CORS está habilitado no backend
3. Verificar logs do browser (F12)

## 🔄 Atualizações

### 1. Atualizar Código
```bash
# 1. Fazer pull das mudanças
git pull

# 2. Rebuild das imagens
docker build -t webhook-redistributor-backend:latest ./server
docker build -t webhook-redistributor-frontend:latest ./client

# 3. Redeploy
docker stack deploy -c docker-compose.yml webhook-redistributor
```

### 2. Rollback
```bash
# Listar versões
docker service ps webhook-redistributor_webhook-backend

# Rollback para versão anterior
docker service rollback webhook-redistributor_webhook-backend
```

## 📝 Notas Importantes

1. **Backup**: O banco de dados é persistido no volume `webhook_data`
2. **SSL**: Certificados são gerenciados automaticamente pelo Let's Encrypt
3. **Escalabilidade**: O backend pode ser escalado horizontalmente
4. **Monitoramento**: Use o Portainer para monitoramento visual
5. **Logs**: Logs são centralizados e podem ser acessados via Portainer

## 🆘 Suporte

Em caso de problemas:
1. Verificar logs dos serviços
2. Verificar configuração do Traefik
3. Verificar DNS e conectividade
4. Verificar certificados SSL
