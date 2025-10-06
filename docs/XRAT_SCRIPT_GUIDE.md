# xrat.sh - Guia de Uso Completo

## 📋 Visão Geral

O `xrat.sh` é o **script oficial** para gerenciar o xRat Ecosystem. Ele substitui comandos Docker diretos e garante configuração correta, logs organizados e operação consistente.

## ⚠️ REGRA IMPORTANTE

**SEMPRE USE `./xrat.sh` AO INVÉS DE COMANDOS DOCKER DIRETOS**

❌ **NÃO FAÇA:**

```bash
docker-compose up -d
docker-compose down
docker-compose restart backend
docker-compose logs -f
```

✅ **FAÇA:**

```bash
./xrat.sh start
./xrat.sh stop
./xrat.sh restart backend
./xrat.sh logs
```

## 🚀 Comandos Disponíveis

### Inicialização e Controle

#### `./xrat.sh start`

Inicia todos os serviços do ecosystem.

```bash
./xrat.sh start
```

**O que faz:**

- Verifica dependências (Docker, Docker Compose)
- Cria rede Docker se não existir
- Inicia todos os containers em background
- Exibe status de cada serviço
- Mostra URLs de acesso

**Serviços iniciados:**

- ✅ nginx (reverse proxy + SSL)
- ✅ backend (Node.js API)
- ✅ frontend (React + Vite)
- ✅ mongodb (banco de dados)
- ✅ redis (cache)

---

#### `./xrat.sh stop`

Para todos os serviços sem remover dados.

```bash
./xrat.sh stop
```

**O que faz:**

- Para todos os containers
- **Preserva dados** (volumes MongoDB e Redis)
- Mantém rede Docker
- Rápido para reiniciar depois

**Use quando:**

- Pausar desenvolvimento temporariamente
- Economizar recursos do sistema
- Não precisa apagar dados

---

#### `./xrat.sh restart [service]`

Reinicia todos os serviços ou um específico.

```bash
# Reiniciar todos
./xrat.sh restart

# Reiniciar apenas backend
./xrat.sh restart backend

# Reiniciar apenas frontend
./xrat.sh restart frontend
```

**Opções de serviço:**

- `nginx` - Reverse proxy
- `backend` - API Node.js
- `frontend` - Interface React
- `mongodb` - Banco de dados
- `redis` - Cache

**Use quando:**

- Aplicar mudanças de código
- Resolver problemas de conexão
- Recarregar configurações

---

### Monitoramento e Logs

#### `./xrat.sh logs [service]`

Exibe logs em tempo real.

```bash
# Ver logs de todos os serviços
./xrat.sh logs

# Ver apenas logs do backend
./xrat.sh logs backend

# Ver apenas logs do frontend
./xrat.sh logs frontend
```

**Recursos:**

- Logs coloridos por serviço
- Timestamp em cada linha
- Acompanhamento em tempo real (tail -f)
- Ctrl+C para sair

**Use quando:**

- Debugar problemas
- Monitorar requests
- Ver erros em tempo real

---

#### `./xrat.sh status`

Exibe status de todos os serviços.

```bash
./xrat.sh status
```

**Informações exibidas:**

- Status de cada container (Up/Down)
- Portas expostas
- Health status
- Tempo de uptime
- Consumo de recursos

**Use quando:**

- Verificar se tudo está rodando
- Confirmar health checks
- Troubleshooting inicial

---

### Manutenção e Limpeza

#### `./xrat.sh clean`

Remove TUDO (containers, volumes, rede).

```bash
./xrat.sh clean
```

⚠️ **ATENÇÃO:** Esta operação é **destrutiva**!

**O que remove:**

- Todos os containers
- Volumes do MongoDB (dados permanentes)
- Volumes do Redis (cache)
- Rede Docker
- Imagens não usadas

**Use quando:**

- Reset completo necessário
- Limpar ambiente de desenvolvimento
- Resolver problemas de estado inconsistente
- Liberar espaço em disco

**NÃO USE em produção sem backup!**

---

#### `./xrat.sh rebuild [service]`

Reconstrói imagens Docker.

```bash
# Reconstruir tudo
./xrat.sh rebuild

# Reconstruir apenas backend
./xrat.sh rebuild backend

# Reconstruir apenas frontend
./xrat.sh rebuild frontend
```

**O que faz:**

- Para containers
- Remove imagens antigas
- Reconstrói do zero (--no-cache)
- Reinicia serviços

**Use quando:**

- Mudanças no Dockerfile
- Dependências atualizadas (package.json)
- Problemas de build
- Forçar instalação limpa

---

### Comandos Avançados

#### `./xrat.sh shell <service>`

Abre shell interativo no container.

```bash
# Shell no backend
./xrat.sh shell backend

# Shell no frontend
./xrat.sh shell frontend
```

**Use quando:**

- Executar comandos npm diretamente
- Inspecionar arquivos no container
- Debug avançado
- Testar comandos

**Exemplos de uso:**

```bash
# Instalar pacote no backend
./xrat.sh shell backend
> npm install axios

# Rodar testes no frontend
./xrat.sh shell frontend
> npm test
```

---

#### `./xrat.sh exec <service> <command>`

Executa comando único no container.

```bash
# Rodar testes do backend
./xrat.sh exec backend npm test

# Checar versão do Node
./xrat.sh exec backend node --version

# Limpar cache npm
./xrat.sh exec frontend npm cache clean --force
```

**Diferença do shell:**

- Executa comando e sai
- Não interativo
- Útil para scripts

---

### Informações e Ajuda

#### `./xrat.sh help`

Exibe ajuda rápida.

```bash
./xrat.sh help
```

Mostra todos os comandos disponíveis com descrição curta.

---

#### `./xrat.sh version`

Exibe versão do ecosystem.

```bash
./xrat.sh version
```

---

## 🎯 Casos de Uso Comuns

### Dia a Dia de Desenvolvimento

```bash
# Manhã - Iniciar trabalho
./xrat.sh start
./xrat.sh logs

# Durante desenvolvimento - Ver logs específicos
./xrat.sh logs backend  # Em um terminal
./xrat.sh logs frontend # Em outro terminal

# Aplicar mudanças no código
./xrat.sh restart backend

# Fim do dia - Parar
./xrat.sh stop
```

---

### Troubleshooting

```bash
# 1. Verificar status
./xrat.sh status

# 2. Ver logs para identificar erro
./xrat.sh logs backend

# 3. Reiniciar serviço problemático
./xrat.sh restart backend

# 4. Se não resolver, reconstruir
./xrat.sh rebuild backend

# 5. Último recurso - reset completo
./xrat.sh clean
./xrat.sh start
```

---

### Atualizar Dependências

```bash
# Backend
./xrat.sh shell backend
> npm update
> exit

./xrat.sh rebuild backend

# Frontend
./xrat.sh shell frontend
> npm update
> exit

./xrat.sh rebuild frontend
```

---

### Backup e Restore

```bash
# Backup MongoDB
docker exec xrat-mongodb mongodump --out /backup

# Restore MongoDB
docker exec xrat-mongodb mongorestore /backup

# Nota: Use comandos Docker diretos para backup/restore
# pois xrat.sh foca em operações de desenvolvimento
```

---

## 🔍 Arquitetura do Script

### Verificações Automáticas

O script verifica automaticamente:

- ✅ Docker instalado e rodando
- ✅ Docker Compose disponível
- ✅ Permissões de execução
- ✅ Arquivo docker-compose.yml presente
- ✅ Rede Docker existente

### Logs Organizados

Todos os logs são salvos em:

```
logs/
├── xrat-operations.log  # Operações do script
├── backend/            # Logs do backend
├── frontend/           # Logs do frontend
├── nginx/             # Logs do nginx
├── mongodb/           # Logs do MongoDB
└── redis/             # Logs do Redis
```

### Códigos de Saída

- `0` - Sucesso
- `1` - Erro genérico
- `2` - Dependência faltando
- `3` - Serviço não encontrado

---

## 📚 Integração com Documentação

Para mais informações sobre cada componente:

- **Backend**: `docs/backend-setup.md`
- **Frontend**: `docs/frontend-setup.md`
- **API**: `docs/API.md`
- **Testing**: `docs/TESTING.md`
- **Contributing**: `docs/CONTRIBUTING.md`

---

## ❓ FAQ

### Por que não usar docker-compose diretamente?

O `xrat.sh` adiciona:

- ✅ Verificações de pré-requisitos
- ✅ Logs organizados e coloridos
- ✅ Mensagens de erro claras
- ✅ Comandos simplificados
- ✅ Operações consistentes
- ✅ Validações automáticas

### Posso usar docker-compose para comandos específicos?

Sim, para operações que o script não cobre (ex: backup, inspect), use Docker direto. Mas para operações diárias, **sempre prefira xrat.sh**.

### O script funciona em Windows?

O script é feito para **Bash (Linux/macOS)**. No Windows:

- Use WSL2 (Windows Subsystem for Linux)
- Ou use PowerShell equivalentes
- Ou use Docker Desktop diretamente

### Como contribuir com melhorias no script?

1. Abra issue descrevendo a melhoria
2. Fork o repositório
3. Edite `xrat.sh`
4. Teste todas as operações
5. Abra Pull Request

---

## 🎉 Dicas Pro

### 1. Aliases Úteis

Adicione ao seu `.bashrc` ou `.zshrc`:

```bash
alias xstart='./xrat.sh start'
alias xstop='./xrat.sh stop'
alias xrestart='./xrat.sh restart'
alias xlogs='./xrat.sh logs'
alias xstatus='./xrat.sh status'
```

### 2. Watch Automático

Use `watch` para monitorar status:

```bash
watch -n 2 './xrat.sh status'
```

### 3. Logs em Arquivo

Salvar logs em arquivo:

```bash
./xrat.sh logs backend > backend-debug.log 2>&1
```

### 4. Múltiplos Terminais

Configure seu terminal para:

- Terminal 1: Código (VS Code/Vim)
- Terminal 2: `./xrat.sh logs backend`
- Terminal 3: `./xrat.sh logs frontend`
- Terminal 4: Comandos gerais

---

**Criado com ❤️ para o xRat Ecosystem**

**Última atualização:** 6 de outubro de 2025
