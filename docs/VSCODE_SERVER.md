# 🖥️ VS Code Server - Desenvolvimento no Navegador

O **xRat Ecosystem** agora inclui um container dedicado com **VS Code Server** (code-server) que permite desenvolver diretamente no navegador com acesso completo a todos os serviços Docker.

## 🎯 Características

### ✅ Acesso Completo aos Serviços
- 🗄️ **MongoDB** - Cliente mongo instalado
- 🔴 **Redis** - Redis CLI disponível
- 🔧 **Backend** - Acesso direto ao código Node.js
- ⚛️ **Frontend** - Acesso direto ao código React
- 🌐 **Nginx** - Gerenciar proxy reverso
- 🐳 **Docker** - Socket montado para gerenciar containers

### ✅ Ferramentas Pré-instaladas
- `docker` e `docker-compose` - Gerenciar containers
- `mongosh` - MongoDB shell
- `redis-cli` - Redis client
- `curl` - Testar APIs
- `git` - Controle de versão
- VS Code Extensions instaláveis

### ✅ Persistência
- Configurações do VS Code salvas em volume
- Extensões persistem entre reinicializações
- Workspace completo montado

---

## 🚀 Como Usar

### 1️⃣ Iniciar o Container

```bash
# Iniciar apenas o VS Code Server
docker compose up -d vscode

# Ou iniciar todo o ecosystem (recomendado)
docker compose up -d
```

### 2️⃣ Acessar no Navegador

Abra seu navegador em:
```
http://localhost:8443
```

**Senha padrão:** `xrat_vscode_2025`

### 3️⃣ Configurar Workspace

O workspace já está montado em `/home/coder/project` com toda a estrutura:
```
/home/coder/project/
├── backend/
├── frontend/
├── nginx/
├── docs/
├── docker-compose.yml
└── ...todos os arquivos do projeto
```

---

## 🔧 Comandos Úteis Dentro do VS Code Server

### MongoDB
```bash
# Conectar ao MongoDB
mongosh mongodb://admin:xrat_secret_2025@mongodb:27017/xrat_db --authenticationDatabase admin

# Ver databases
show dbs

# Usar database
use xrat_db

# Ver collections
show collections
```

### Redis
```bash
# Conectar ao Redis
redis-cli -h redis -a xrat_redis_2025

# Testar conexão
PING

# Listar keys
KEYS *

# Ver valor
GET key_name
```

### Docker
```bash
# Listar containers
docker ps

# Ver logs
docker logs xrat-backend
docker logs xrat-frontend

# Restart container
docker compose restart backend

# Executar comando em container
docker compose exec backend npm test
```

### Backend
```bash
# Navegar para backend
cd /home/coder/project/backend

# Instalar dependências
npm install

# Rodar testes
npm test

# Ver logs
tail -f logs/combined.log
```

### Frontend
```bash
# Navegar para frontend
cd /home/coder/project/frontend

# Instalar dependências
npm install

# Rodar testes
npm test

# Build
npm run build
```

---

## 🎨 Instalar Extensões

Dentro do VS Code Server, você pode instalar extensões normalmente:

### Extensões Recomendadas:
1. **ESLint** - `dbaeumer.vscode-eslint`
2. **Prettier** - `esbenp.prettier-vscode`
3. **Docker** - `ms-azuretools.vscode-docker`
4. **MongoDB** - `mongodb.mongodb-vscode`
5. **GitLens** - `eamodio.gitlens`

### Como Instalar:
1. Clique no ícone de Extensions (Ctrl+Shift+X)
2. Busque pela extensão
3. Clique em "Install"

---

## 🔐 Segurança

### Alterar Senha

**Via Environment Variable:**
```bash
# Edite .env ou .env.example
VSCODE_PASSWORD=sua_nova_senha_aqui
VSCODE_SUDO_PASSWORD=sua_senha_sudo_aqui
```

**Restart o container:**
```bash
docker compose restart vscode
```

### Acesso Root

O container roda como `root` para ter acesso ao Docker socket, mas o VS Code Server roda como usuário `coder`.

Para executar comandos sudo:
```bash
sudo apt-get install <pacote>
# Senha: xrat_sudo_2025 (ou sua senha customizada)
```

---

## 📊 Endpoints Acessíveis

Do VS Code Server container, você tem acesso a:

| Serviço | URL Interna | Descrição |
|---------|-------------|-----------|
| Backend API | `http://backend:3000` | API REST |
| Frontend | `http://frontend:5173` | React App |
| MongoDB | `mongodb://mongodb:27017` | Database |
| Redis | `redis://redis:6379` | Cache |
| Nginx | `http://nginx:80` | Reverse Proxy |

### Exemplo de Teste:
```bash
# Testar backend diretamente
curl http://backend:3000/health

# Testar através do nginx
curl http://nginx/api/health

# Testar frontend
curl http://frontend:5173
```

---

## 🐛 Troubleshooting

### VS Code Server não inicia

```bash
# Ver logs
docker logs xrat-vscode

# Restart
docker compose restart vscode

# Rebuild
docker compose up -d --build vscode
```

### Não consegue conectar ao MongoDB

```bash
# Verificar se MongoDB está rodando
docker ps | grep mongodb

# Testar conexão
docker compose exec vscode mongosh mongodb://admin:xrat_secret_2025@mongodb:27017/xrat_db --authenticationDatabase admin
```

### Não consegue gerenciar Docker

```bash
# Verificar socket
docker compose exec vscode ls -l /var/run/docker.sock

# Testar Docker
docker compose exec vscode docker ps
```

### Permissões de arquivo

```bash
# Ajustar permissões
docker compose exec vscode chown -R coder:coder /home/coder/project
```

---

## 🔄 Workflow Recomendado

### Desenvolvimento Full-Stack:

1. **Abra VS Code Server** em `http://localhost:8080`

2. **Terminal 1 - Backend:**
   ```bash
   cd /home/coder/project/backend
   npm run dev
   docker logs -f xrat-backend
   ```

3. **Terminal 2 - Frontend:**
   ```bash
   cd /home/coder/project/frontend
   npm run dev
   docker logs -f xrat-frontend
   ```

4. **Terminal 3 - Testes:**
   ```bash
   # Backend tests
   cd /home/coder/project/backend
   npm test
   
   # Frontend tests
   cd /home/coder/project/frontend
   npm test
   ```

5. **Terminal 4 - Database:**
   ```bash
   mongosh mongodb://admin:xrat_secret_2025@mongodb:27017/xrat_db --authenticationDatabase admin
   ```

---

## 📦 Volumes Persistentes

Os seguintes dados são persistidos entre reinicializações:

- ✅ **Configurações do VS Code:** `xrat-vscode-data`
- ✅ **Extensões instaladas:** `xrat-vscode-extensions`
- ✅ **Código fonte:** Montado de `./` (host)

Para limpar dados:
```bash
# Remove volumes do VS Code
docker volume rm xrat-vscode-data xrat-vscode-extensions

# Restart
docker compose up -d vscode
```

---

## 🚀 Comparação: VS Code Local vs Server

| Característica | VS Code Local | VS Code Server |
|---------------|---------------|----------------|
| Acesso aos containers | ✅ Via Remote-Containers | ✅ Nativo |
| Navegador | ❌ Precisa VS Code instalado | ✅ Qualquer navegador |
| Performance | ⚡ Máxima | 🔥 Ótima |
| Ferramentas CLI | ⚠️ Precisa instalar | ✅ Pré-instaladas |
| Portabilidade | ❌ Depende do host | ✅ 100% containerizado |
| Múltiplos devs | ❌ Um por máquina | ✅ Acesso compartilhado |

---

## 🎯 Casos de Uso

### 1. Desenvolvimento Remoto
Acesse seu ambiente de desenvolvimento de qualquer lugar, qualquer dispositivo com navegador.

### 2. Onboarding de Devs
Novo desenvolvedor? Apenas rode `docker compose up` e acesse `localhost:8080`.

### 3. Pair Programming
Compartilhe a URL do VS Code Server (com tunneling/ngrok) para colaboração remota.

### 4. CI/CD Testing
Execute testes e builds dentro do container isolado.

### 5. Debugging em Produção
Acesse um environment de produção idêntico ao desenvolvimento.

---

## 📚 Referências

- [code-server Documentation](https://coder.com/docs/code-server)
- [VS Code Server API](https://code.visualstudio.com/api)
- [Docker Socket Access](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option)

---

## ✅ Checklist

Antes de começar a desenvolver no VS Code Server:

- [ ] Container `xrat-vscode` está rodando (`docker ps`)
- [ ] Acesso em `http://localhost:8080` funciona
- [ ] Senha de acesso configurada (`.env`)
- [ ] MongoDB acessível via `mongosh`
- [ ] Redis acessível via `redis-cli`
- [ ] Docker commands funcionando (`docker ps`)
- [ ] Extensões essenciais instaladas
- [ ] Terminal integrado funcionando

🎉 **Pronto para desenvolver no navegador!** 🚀
