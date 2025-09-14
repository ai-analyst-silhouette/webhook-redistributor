#!/bin/bash

# Script para buildar e enviar imagens para Docker Hub
# Uso: ./build-and-push.sh [version]

set -e

# Configurações
DOCKER_USERNAME="ai-analyst-silhouette"
BACKEND_IMAGE="webhook-redistributor-backend"
FRONTEND_IMAGE="webhook-redistributor-frontend"
VERSION=${1:-latest}

echo "🐳 Building and pushing Docker images to Docker Hub"
echo "📦 Version: $VERSION"
echo "👤 Docker Hub User: $DOCKER_USERNAME"
echo ""

# Verificar se está logado no Docker Hub
if ! docker info | grep -q "Username"; then
    echo "❌ Please login to Docker Hub first:"
    echo "   docker login"
    exit 1
fi

echo "🔨 Building backend image..."
docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE:$VERSION ./server
docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE:latest ./server

echo "🔨 Building frontend image..."
docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION ./client
docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE:latest ./client

echo "📤 Pushing backend image..."
docker push $DOCKER_USERNAME/$BACKEND_IMAGE:$VERSION
docker push $DOCKER_USERNAME/$BACKEND_IMAGE:latest

echo "📤 Pushing frontend image..."
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE:latest

echo ""
echo "✅ Images successfully built and pushed to Docker Hub!"
echo ""
echo "📋 Images:"
echo "   - $DOCKER_USERNAME/$BACKEND_IMAGE:$VERSION"
echo "   - $DOCKER_USERNAME/$BACKEND_IMAGE:latest"
echo "   - $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION"
echo "   - $DOCKER_USERNAME/$FRONTEND_IMAGE:latest"
echo ""
echo "🚀 To deploy on your server:"
echo "   1. Clone the repository: git clone https://github.com/$DOCKER_USERNAME/webhook-redistributor.git"
echo "   2. Run: docker stack deploy -c docker-compose.yml webhook-redistributor"
echo ""
