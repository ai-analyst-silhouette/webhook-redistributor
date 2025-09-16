#!/bin/bash

# Script para buildar e enviar imagens para Docker Hub
# Uso: ./build-and-push.sh

set -e

# Configurações
DOCKER_USERNAME="aianalystsilhouette"
BACKEND_IMAGE="webhook-redistributor-backend"
FRONTEND_IMAGE="webhook-redistributor-frontend"

echo "🐳 Building and pushing Docker images to Docker Hub"
echo "📦 Version: latest"
echo "👤 Docker Hub User: $DOCKER_USERNAME"
echo ""

# Verificar se está logado no Docker Hub
if ! docker info | grep -q "Username"; then
    echo "❌ Please login to Docker Hub first:"
    echo "   docker login"
    exit 1
fi

echo "🔨 Building backend image..."
docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE:latest ./server

echo "🔨 Building frontend image..."
docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE:latest ./client

echo "📤 Pushing backend image..."
docker push $DOCKER_USERNAME/$BACKEND_IMAGE:latest

echo "📤 Pushing frontend image..."
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE:latest

echo ""
echo "✅ Images successfully built and pushed to Docker Hub!"
echo ""
echo "📋 Images:"
echo "   - $DOCKER_USERNAME/$BACKEND_IMAGE:latest"
echo "   - $DOCKER_USERNAME/$FRONTEND_IMAGE:latest"
echo ""
echo "🚀 To deploy on your server:"
echo "   docker stack deploy -c docker-compose.yml webhook-redistributor"
echo ""
