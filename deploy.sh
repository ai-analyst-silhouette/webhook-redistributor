#!/bin/bash

# Script de Deploy para Docker Swarm
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do Webhook Redistributor..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar se está no modo swarm
if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
    error "Docker Swarm não está ativo. Execute: docker swarm init"
fi

# Verificar se a rede existe
if ! docker network ls | grep -q "webhook_network"; then
    log "Criando rede webhook_network..."
    docker network create --driver overlay webhook_network
else
    log "Rede webhook_network já existe"
fi

# Build das imagens
log "Construindo imagem do backend..."
docker build -t webhook-redistributor-backend:latest ./server

log "Construindo imagem do frontend..."
docker build -t webhook-redistributor-frontend:latest ./client

# Deploy do stack
log "Fazendo deploy do stack..."
docker stack deploy -c docker-compose.yml webhook-redistributor

# Aguardar serviços ficarem prontos
log "Aguardando serviços ficarem prontos..."
sleep 10

# Verificar status
log "Verificando status dos serviços..."
docker service ls | grep webhook

log "✅ Deploy concluído!"
log "🌐 Frontend: https://redistribuidor-front.silhouetteexperts.com.br"
log "🔗 Backend: https://redistribuidor-back.silhouetteexperts.com.br"
log "📊 Monitoramento: docker service logs -f webhook-redistributor_webhook-backend"
