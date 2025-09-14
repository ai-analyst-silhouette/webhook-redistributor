#!/bin/bash

# Script para deploy no servidor usando Docker Swarm
# Uso: ./deploy-server.sh

set -e

echo "🚀 Deploying Webhook Redistributor to Docker Swarm"
echo ""

# Verificar se está em modo swarm
if ! docker info | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm not initialized. Please run:"
    echo "   docker swarm init"
    exit 1
fi

# A rede será criada automaticamente pelo Docker Swarm
echo "🌐 Network webhook_network will be created automatically by Docker Swarm"

# Fazer pull das imagens mais recentes
echo "📥 Pulling latest images..."
docker pull ai-analyst-silhouette/webhook-redistributor-backend:latest
docker pull ai-analyst-silhouette/webhook-redistributor-frontend:latest

# Deploy do stack
echo "🚀 Deploying stack..."
docker stack deploy -c docker-compose.yml webhook-redistributor

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Services:"
echo "   - Backend: ai-analyst-silhouette/webhook-redistributor-backend:latest"
echo "   - Frontend: ai-analyst-silhouette/webhook-redistributor-frontend:latest"
echo ""
echo "🌐 URLs:"
echo "   - Frontend: https://redistribuidor-front.silhouetteexperts.com.br"
echo "   - Backend: https://redistribuidor-back.silhouetteexperts.com.br"
echo "   - Traefik Dashboard: http://your-server:8080"
echo ""
echo "📊 Check status:"
echo "   docker stack services webhook-redistributor"
echo "   docker stack ps webhook-redistributor"
echo ""
