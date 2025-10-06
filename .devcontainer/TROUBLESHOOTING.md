# Instruções para Resolver Problemas do DevContainer

## Problema: Erro ao iniciar o DevContainer

Se você está enfrentando o erro "Exit code 1" ou "error code 137" ao iniciar o DevContainer, este guia vai ajudar você a resolver o problema.

Os scripts `prepare-environment.sh` e `fix-vscode-permissions.sh` foram adicionados para ajudar a corrigir esses problemas automaticamente, mas se ainda houver falhas, siga as instruções abaixo.

## Soluções Disponíveis

### 1. Use a configuração atualizada

Foram feitas modificações no arquivo `devcontainer.json` para melhorar a alocação de recursos e otimizar a inicialização:

- Aumento da memória alocada para 8GB
- Aumento dos CPUs para 4 cores
- Adição de memória compartilhada (1GB)
- Otimização dos comandos de inicialização

### 2. Use a versão simplificada

Se ainda tiver problemas, uma versão simplificada do DevContainer está disponível, com menos features e requisitos:

```bash
cd .devcontainer
cp devcontainer.simplified.json devcontainer.json
```

### 3. Execute os scripts de correção automática

Foram criados scripts para ajudar a corrigir problemas comuns:

```bash
# Script de preparação do ambiente
cd .devcontainer
./prepare-environment.sh

# Script de correção de permissões do VS Code Server
cd .devcontainer
./fix-vscode-permissions.sh

# Script de diagnóstico
cd .devcontainer
./troubleshoot.sh
```

## Requisitos de sistema recomendados

Para garantir que o DevContainer funcione corretamente, seu sistema deve ter:

- Pelo menos 8GB de RAM disponível
- Pelo menos 4 cores de CPU
- Pelo menos 20GB de espaço livre em disco
- Docker configurado corretamente

## Erros comuns e soluções

### Erro: Exit code 137

Este erro geralmente indica que o processo foi encerrado pelo sistema devido à falta de memória.

**Solução**: Aumente a memória disponível para o Docker ou feche aplicativos que consomem muita memória.

### Erro: Failed to install VS Code Server

**Solução**: 
1. Remova imagens e containers Docker existentes relacionados ao DevContainer
2. Certifique-se de ter uma conexão estável à internet
3. Tente a versão simplificada do DevContainer

## Comandos úteis

Limpar containers e imagens existentes:
```bash
docker rm -f $(docker ps -a -q)
docker system prune -a
```

Verificar recursos disponíveis:
```bash
free -h
nproc
df -h
```