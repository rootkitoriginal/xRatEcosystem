#!/bin/bash

echo "===== xRat DevContainer Troubleshooter ====="
echo "Verificando ambiente e requisitos..."
echo ""

# Verificando Docker
echo "## Verificando Docker"
docker --version
if [ $? -ne 0 ]; then
  echo "⚠️ Docker não está instalado ou não está funcionando corretamente."
else
  echo "✅ Docker instalado"
fi
echo ""

# Verificando espaço em disco
echo "## Verificando espaço em disco"
df -h /
echo ""

# Verificando memória disponível
echo "## Verificando memória"
free -h
echo ""

# Verificando CPU
echo "## Verificando CPU"
nproc
echo "Cores lógicos disponíveis: $(nproc)"
echo ""

# Verificando permissões
echo "## Verificando permissões do usuário atual"
id
echo ""
echo "Permissões no diretório do projeto:"
ls -la $(dirname $(pwd))
echo ""

# Verificando imagens Docker
echo "## Imagens Docker disponíveis"
docker images | grep -E 'mcr.microsoft.com/devcontainers|NODE|UBUNTU'
echo ""

# Verificando containers Docker
echo "## Containers Docker em execução"
docker ps -a
echo ""

# Verificando configurações do DevContainer
echo "## Verificando configuração do DevContainer"
if [ -f "devcontainer.json" ]; then
  echo "devcontainer.json existe"
  # Verificando se o arquivo JSON é válido
  cat devcontainer.json | python3 -m json.tool > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ JSON válido"
  else
    echo "⚠️ JSON inválido"
    echo "Erro de sintaxe no arquivo devcontainer.json"
  fi
else
  echo "⚠️ devcontainer.json não encontrado"
fi
echo ""

echo "## Sugestões de solução:"
echo "1. Verifique se o Docker está funcionando corretamente"
echo "2. Certifique-se de que há pelo menos 8GB de memória RAM disponível"
echo "3. Certifique-se de que há pelo menos 4 cores de CPU disponíveis"
echo "4. Certifique-se de que há pelo menos 20GB de espaço livre em disco"
echo "5. Se estiver usando Windows, verifique se o WSL2 está configurado corretamente"
echo "6. Tente excluir a imagem do DevContainer e reconstruí-la"
echo "7. Se tiver uma versão simplificada, tente usá-la: cp devcontainer.simplified.json devcontainer.json"
echo ""

echo "===== Fim do Troubleshooter ====="