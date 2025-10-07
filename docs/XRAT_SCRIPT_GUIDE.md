# xrat.sh - Guia de Uso Completo

## 📋 Visão Geral

O `xrat.sh` é o **script oficial** para gerenciar o xRat Ecosystem. Ele encapsula os comandos essenciais do Docker Compose e oferece uma forma padronizada de iniciar, parar e inspecionar os serviços locais.

## ⚠️ REGRA IMPORTANTE

**SEMPRE USE `./xrat.sh` AO INVÉS DE COMANDOS DOCKER DIRETOS**

❌ **NÃO FAÇA:**

```bash
docker compose up -d
docker compose down
docker compose restart backend
docker compose logs -f
```

✅ **FAÇA:**

```bash
./xrat.sh start
./xrat.sh stop
./xrat.sh restart
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

- Executa `docker compose up -d --build`
- Mantém todos os serviços principais em execução
- Mostra pontos de acesso após a subida

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

#### `./xrat.sh restart`

Reinicia todos os serviços do ecosystem.

```bash
./xrat.sh restart
```

**Dica:** Para reiniciar apenas um serviço específico, utilize diretamente o Docker Compose, por exemplo:

```bash
docker compose restart backend
```

**Use quando:**

- Aplicar mudanças de código
- Resolver problemas de conexão
- Recarregar configurações

---

### Monitoramento e Logs

#### `./xrat.sh logs`

Exibe os logs combinados de todos os serviços em tempo real.

```bash
./xrat.sh logs
```

**Dica:** Para focar em um serviço específico, rode `docker compose logs -f <serviço>` diretamente.

**Recursos:**

- Acompanhamento em tempo real (tail -f)
- Saída contínua até pressionar `Ctrl+C`

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

#### `./xrat.sh rebuild`

Reconstrói todas as imagens e reinicia os serviços.

```bash
./xrat.sh rebuild
```

**O que faz:**

- Executa `docker compose up -d --build --force-recreate`
- Garante que as imagens sejam atualizadas
- Reinicia todo o ecosystem após o rebuild

**Dica:** Para forçar o rebuild de um único serviço, use diretamente `docker compose up -d --build --force-recreate <serviço>`.

**Use quando:**

- Mudanças no Dockerfile
- Dependências atualizadas (package.json)
- Problemas de build
- Necessidade de instalação limpa

---

### Comandos Avançados

#### Shells disponíveis

O script oferece atalhos para abrir um shell interativo em serviços específicos:

```bash
./xrat.sh shell-backend
./xrat.sh shell-frontend
./xrat.sh shell-mongo
./xrat.sh shell-redis
```

**Use quando:**

- Executar comandos npm diretamente
- Inspecionar arquivos no container
- Realizar debug avançado

**Exemplos de uso:**

```bash
# Instalar pacote no backend
./xrat.sh shell-backend
> npm install axios

# Rodar testes no frontend
./xrat.sh shell-frontend
> npm test
```

Para executar um comando único sem abrir shell interativo, utilize diretamente o Docker Compose:

```bash
docker compose exec backend npm test
docker compose exec backend node --version
docker compose exec frontend npm cache clean --force
```

---

### Informações e Ajuda

#### Ajuda rápida

Execute o script sem argumentos para exibir o resumo de comandos suportados.

```bash
./xrat.sh
```

O uso incorreto retorna o menu de ajuda padrão do script.

---

## 🎯 Casos de Uso Comuns

### Dia a Dia de Desenvolvimento

```bash
# Manhã - Iniciar trabalho
./xrat.sh start
./xrat.sh logs

# Durante desenvolvimento - Ver logs específicos
docker compose logs -f backend  # Terminal dedicado
docker compose logs -f frontend # Outro terminal

# Aplicar mudanças no código
./xrat.sh restart

# Fim do dia - Parar
./xrat.sh stop
```

---

### Troubleshooting

```bash
# 1. Verificar status
./xrat.sh status

# 2. Ver logs para identificar erro
./xrat.sh logs

# 3. Reiniciar serviço problemático
docker compose restart backend

# 4. Se não resolver, reconstruir
docker compose up -d --build --force-recreate backend

# 5. Último recurso - reset completo
./xrat.sh clean
./xrat.sh start
```

---

### Atualizar Dependências

```bash
# Backend
./xrat.sh shell-backend
> npm update
> exit

docker compose up -d --build --force-recreate backend

# Frontend
./xrat.sh shell-frontend
> npm update
> exit

docker compose up -d --build --force-recreate frontend
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

### Como funciona

- Executa comandos `docker compose` pré-definidos (start, stop, restart, logs, rebuild, etc.).
- Utiliza `set -e` para interromper a execução ao primeiro erro retornado pelo Docker.
- Força a execução a partir da raiz do repositório.

### Pré-requisitos

- Docker instalado e ativo.
- Docker Compose (plugin v2) disponível no PATH.
- Permissão de execução no arquivo `xrat.sh` (`chmod +x xrat.sh`).

### Saída de logs

Os logs são exibidos diretamente via `docker compose logs`. Para salvar em arquivo, redirecione a saída manualmente:

```bash
./xrat.sh logs > logs/xrat.log 2>&1
```

### Códigos de saída

- `0` - Sucesso
- `1` - Erro genérico

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

### Por que não usar `docker compose` diretamente?

O `xrat.sh` adiciona:

- ✅ Comandos simplificados e padronizados para o time
- ✅ Mensagens amigáveis durante start/stop/restart
- ✅ Atalhos para abrir shells nos serviços principais
- ✅ Convenções alinhadas com a documentação oficial do projeto
- ✅ Menos chance de esquecer opções (`--build`, `--force-recreate`, etc.)

### Posso usar `docker compose` para comandos específicos?

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
docker compose logs -f backend > backend-debug.log 2>&1
```

### 4. Múltiplos Terminais

Configure seu terminal para:

- Terminal 1: Código (VS Code/Vim)
- Terminal 2: `docker compose logs -f backend`
- Terminal 3: `docker compose logs -f frontend`
- Terminal 4: Comandos gerais

---

Criado com ❤️ para o xRat Ecosystem

Última atualização: 6 de outubro de 2025
