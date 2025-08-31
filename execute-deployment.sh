#!/bin/bash

# KIXIKILA - Production Deployment Executor
echo "🚀 Iniciando KIXIKILA Production Deployment..."
echo "================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor instalar Node.js primeiro."
    exit 1
fi

# Make scripts executable
chmod +x scripts/*.js

# Execute the master deployment script
echo "⚡ Executando master deployment script..."
node scripts/execute-production-deployment.js

echo "✅ Deployment script concluído!"