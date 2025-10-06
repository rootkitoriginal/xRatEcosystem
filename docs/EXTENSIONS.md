# 📦 Extensões Obrigatórias - xRat Ecosystem

Este documento lista todas as extensões **obrigatórias** que devem ser instaladas no VS Code para trabalhar com o projeto xRat Ecosystem.

## 🔴 Extensões Obrigatórias

Quando você abrir o workspace `xRatEcosystem.code-workspace`, o VS Code automaticamente recomendará estas extensões. **Clique em "Install All"** quando aparecer a notificação.

### 🤖 GitHub & Copilot
- ✅ **GitHub Copilot** (`GitHub.copilot`)
  - AI pair programming
  - Autocompletar código inteligente
  
- ✅ **GitHub Copilot Chat** (`GitHub.copilot-chat`)
  - Chat com AI para ajuda em código
  - Explicações e sugestões
  
- ✅ **GitHub Pull Requests** (`GitHub.vscode-pull-request-github`)
  - Gerenciar PRs diretamente no VS Code
  - Code reviews integrados

### 🗄️ Database & APIs
- ✅ **MongoDB for VS Code** (`mongodb.mongodb-vscode`)
  - **OBRIGATÓRIO**: Conectar e gerenciar MongoDB
  - Query playground integrado
  - Preset connection configurado: `mongodb://admin:xrat_secret_2025@xrat-mongodb:27017/xrat_db`
  
- ✅ **Postman** (`Postman.postman-for-vscode`)
  - **OBRIGATÓRIO**: Testar APIs REST
  - Collections e environments
  - Sincronização com Postman Cloud

### 🐳 Docker & Containers
- ✅ **Docker** (`ms-azuretools.vscode-docker`)
  - **OBRIGATÓRIO**: Gerenciar containers Docker
  - Visualizar logs, status, rebuild
  - Compose commands integrados
  
- ✅ **Remote - Containers** (`ms-vscode-remote.remote-containers`)
  - **OBRIGATÓRIO**: Desenvolver dentro dos containers
  - Abrir VS Code no container backend/frontend
  - Environment isolation

### 🛠️ Code Quality
- ✅ **Prettier** (`esbenp.prettier-vscode`)
  - **OBRIGATÓRIO**: Formatação automática de código
  - Configurado para formatar ao salvar
  - Single quotes, 2 espaços de tab
  
- ✅ **ESLint** (`dbaeumer.vscode-eslint`)
  - **OBRIGATÓRIO**: Linting JavaScript/TypeScript
  - Auto-fix ao salvar
  - Segue configuração do projeto

### 📊 Git & Version Control
- ✅ **GitLens** (`eamodio.gitlens`)
  - Code lens com informações de commits
  - Blame annotations
  - History visualization

### 📝 Configuration Files
- ✅ **YAML** (`redhat.vscode-yaml`)
  - Syntax highlighting para docker-compose.yml
  - Validation e autocompletion
  
- ✅ **JSON Language Service** (`ms-vscode.vscode-json-languageservice`)
  - Melhor suporte para arquivos JSON
  - Validation de package.json

---

## 🚀 Como Instalar

### Método 1: Automático (Recomendado)
```bash
./start-dev.sh
```
Quando o VS Code abrir, clique em **"Install All"** na notificação que aparecer.

### Método 2: Manual
1. Abra o workspace: `code xRatEcosystem.code-workspace`
2. `Ctrl+Shift+X` para abrir Extensions
3. Digite o ID de cada extensão
4. Clique em "Install"

### Método 3: Command Line
```bash
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
code --install-extension GitHub.vscode-pull-request-github
code --install-extension mongodb.mongodb-vscode
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-vscode-remote.remote-containers
code --install-extension Postman.postman-for-vscode
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension eamodio.gitlens
code --install-extension redhat.vscode-yaml
code --install-extension ms-vscode.vscode-json-languageservice
```

---

## ⚙️ Configurações Automáticas

Todas as extensões já estão pré-configuradas no workspace:

### ✅ Prettier
- Format on save: `true`
- Single quotes: `true`
- Tab width: `2 spaces`

### ✅ ESLint
- Auto-fix on save: `true`
- Validates: JavaScript, JSX, TypeScript, TSX

### ✅ MongoDB
- Preset connection: `🐀 xRat MongoDB`
- Auto-connect ao container local

### ✅ Docker
- Compose up command: `docker compose up -d`
- Compose down command: `docker compose down`

---

## 🔍 Verificar Extensões Instaladas

No VS Code:
1. `Ctrl+Shift+X` para abrir Extensions
2. Digite `@recommended` na busca
3. Verifique se todas estão instaladas (✅)

---

## ❓ Troubleshooting

### Extensão não aparece na recomendação
```bash
code --list-extensions
```
Verifique se a extensão está na lista.

### Reinstalar todas
```bash
./start-dev.sh
```
O script verifica e instala automaticamente.

### MongoDB não conecta
1. Verifique se o container está rodando: `docker compose ps`
2. Reinicie o container: `docker compose restart mongodb`
3. Verifique a connection string no workspace

---

## 📚 Documentação das Extensões

- [GitHub Copilot](https://docs.github.com/copilot)
- [MongoDB for VS Code](https://www.mongodb.com/docs/mongodb-vscode/)
- [Postman](https://learning.postman.com/docs/getting-started/basics/about-vs-code-extension/)
- [Docker Extension](https://code.visualstudio.com/docs/containers/overview)
- [Remote Containers](https://code.visualstudio.com/docs/devcontainers/containers)

---

## 🎯 Checklist de Verificação

Antes de começar a desenvolver, verifique:

- [ ] Todas as 12 extensões obrigatórias instaladas
- [ ] MongoDB conectado (🐀 xRat MongoDB no painel lateral)
- [ ] Docker extension mostrando containers
- [ ] Prettier formatando ao salvar
- [ ] ESLint mostrando warnings/errors
- [ ] GitLens mostrando blame annotations
- [ ] Postman disponível no Command Palette

✅ **Tudo OK? Você está pronto para desenvolver!** 🚀
