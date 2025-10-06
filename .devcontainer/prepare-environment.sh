#!/bin/bash

# Script para otimizar a inicialização do VS Code Server no DevContainer
# Este script resolve problemas comuns de inicialização e falhas de memória

echo "🐀 Preparando ambiente para xRat Ecosystem DevContainer..."
echo "📅 Data de execução: $(date)"
echo "👤 Usuário: $(whoami)"
echo "📂 Diretório: $(pwd)"

# Script funcionando no host, não no container
# Não execute comandos que assumem estar dentro do container

# Limpar possíveis containers ou processos anteriores
echo "Limpando processos anteriores..."
docker rm -f $(docker ps -aq --filter name=vsc-xrat) 2>/dev/null || true

# Garantir que Docker tem memória suficiente
echo "Verificando recursos do sistema..."
free -h
df -h

echo "Configurando variáveis de ambiente para o VS Code Server"
export VSCODE_SERVER_TAR_PATH="/tmp/vscode-server.tar.gz"
export NODE_OPTIONS="--max-old-space-size=2048"

echo "✅ Ambiente preparado com sucesso!"
echo "🚀 Iniciando DevContainer..."