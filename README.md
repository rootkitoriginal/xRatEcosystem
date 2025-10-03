# 🐀 xRat Ecosystem

Um ambiente Docker isolado completo com Node.js, MongoDB, Redis, Backend API e Frontend React.

## 📋 Visão Geral

O **xRat Ecosystem** é um ambiente de desenvolvimento totalmente containerizado que fornece:

- 🚀 **Backend API** (Node.js + Express)
- 🎨 **Frontend** (React + Vite)
- 🗄️ **MongoDB** (Database - interno apenas)
- 🔴 **Redis** (Cache - interno apenas)
- 🔒 **Rede isolada Docker** (comunicação interna segura)

### Características Principais

✅ Apenas backend (porta 3000) e frontend (porta 5173) são expostos ao host  
✅ MongoDB e Redis são **internos** - não acessíveis de fora do Docker  
✅ Rede isolada `xrat-network` para comunicação entre serviços  
✅ Health checks para todos os serviços  
✅ Persistência de dados com volumes Docker  
✅ Hot-reload para desenvolvimento  

---

## 🏗️ Estrutura do Projeto

```
xRatEcosystem/
├── backend/
│   ├── src/
│   │   └── index.js          # API Backend
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Componente principal
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── docker-compose.yml        # Orquestração de containers
├── .env                      # Variáveis de ambiente (não commitar)
├── .env.example              # Template de variáveis
├── .gitignore
└── README.md
```

---

## 🚀 Como Usar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

### 1. Configuração Inicial

Clone ou navegue até o diretório do projeto:

```bash
cd /home/rootkit/Apps/xRatEcosystem
```

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure suas senhas (recomendado para produção):

```bash
nano .env
```

### 2. Iniciar o Ecosystem

Para iniciar todos os serviços:

```bash
docker-compose up -d
```

Para ver os logs em tempo real:

```bash
docker-compose logs -f
```

### 3. Acessar os Serviços

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Status**: http://localhost:3000/api/status

**Nota**: MongoDB e Redis **não** são acessíveis de fora do Docker (apenas internamente).

### 4. Parar o Ecosystem

Para parar todos os serviços:

```bash
docker-compose down
```

Para parar e **remover volumes** (apaga dados do banco):

```bash
docker-compose down -v
```

---

## 🔧 Comandos Úteis

### Reconstruir Containers

Após mudanças no código ou Dockerfile:

```bash
docker-compose up -d --build
```

### Ver Status dos Containers

```bash
docker-compose ps
```

### Ver Logs de um Serviço Específico

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
docker-compose logs redis
```

### Executar Comandos dentro de um Container

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh -u admin -p xrat_secret_2025

# Redis
docker-compose exec redis redis-cli -a xrat_redis_2025
```

### Reiniciar um Serviço Específico

```bash
docker-compose restart backend
docker-compose restart frontend
```

---

## 📡 API Endpoints

### Backend API

#### GET `/`
Informações básicas da API

```bash
curl http://localhost:3000/
```

#### GET `/health`
Health check do sistema

```bash
curl http://localhost:3000/health
```

Resposta:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-03T...",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

#### GET `/api/status`
Status detalhado de todos os serviços

```bash
curl http://localhost:3000/api/status
```

#### POST `/api/data`
Salvar dados no Redis cache

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "value": "Hello xRat!"}'
```

#### GET `/api/data/:key`
Recuperar dados do Redis cache

```bash
curl http://localhost:3000/api/data/test
```

---

## 🔒 Segurança

### Configurações Padrão (Desenvolvimento)

⚠️ **IMPORTANTE**: As senhas padrão são para desenvolvimento. **Altere-as em produção!**

No arquivo `.env`:
- `MONGO_ROOT_PASSWORD`: Senha do MongoDB
- `REDIS_PASSWORD`: Senha do Redis

### Rede Isolada

O projeto usa uma rede Docker isolada chamada `xrat-network`:

- MongoDB e Redis **não** são acessíveis de fora do Docker
- Apenas backend e frontend expõem portas ao host
- Comunicação interna entre serviços é segura

### Portas Expostas

- **3000**: Backend API (HTTP)
- **5173**: Frontend (HTTP)

Portas **NÃO** expostas (internas apenas):
- **27017**: MongoDB
- **6379**: Redis

---

## 🗄️ Persistência de Dados

Os dados são persistidos usando volumes Docker:

- `xrat-mongodb-data`: Dados do MongoDB
- `xrat-mongodb-config`: Configuração do MongoDB
- `xrat-redis-data`: Dados do Redis

### Backup dos Dados

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /data/backup

# Backup Redis
docker-compose exec redis redis-cli -a xrat_redis_2025 SAVE
```

### Limpar Todos os Dados

```bash
docker-compose down -v
```

---

## 🛠️ Desenvolvimento

### Backend (Node.js + Express)

O backend está em `./backend/src/index.js` e inclui:

- ✅ Express.js configurado
- ✅ Conexão com MongoDB via Mongoose
- ✅ Conexão com Redis
- ✅ CORS configurado
- ✅ Health checks
- ✅ Endpoints de exemplo

### Frontend (React + Vite)

O frontend está em `./frontend/src/` e inclui:

- ✅ React 18
- ✅ Vite para desenvolvimento rápido
- ✅ Interface para testar a API
- ✅ Dashboard de status dos serviços
- ✅ Hot-reload ativado

### Adicionar Dependências

#### Backend

```bash
docker-compose exec backend npm install <package-name>
```

#### Frontend

```bash
docker-compose exec frontend npm install <package-name>
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
docker-compose logs <service-name>
```

### MongoDB não conecta

Verifique se o container está rodando:
```bash
docker-compose ps mongodb
```

Verifique os logs:
```bash
docker-compose logs mongodb
```

### Redis não conecta

Verifique a senha no `.env`:
```bash
docker-compose logs redis
```

### Frontend não carrega

Limpe o cache e reconstrua:
```bash
docker-compose down
docker-compose up -d --build
```

### Portas em uso

Se as portas 3000 ou 5173 já estão em uso, altere no `.env`:

```env
BACKEND_PORT=3001
FRONTEND_PORT=5174
```

---

## 📦 Tecnologias

- **Backend**: Node.js 20, Express 4, Mongoose 8, Redis 4
- **Frontend**: React 18, Vite 5
- **Database**: MongoDB 7
- **Cache**: Redis 7
- **Container**: Docker, Docker Compose

---

## 📝 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente Node.js | `development` |
| `BACKEND_PORT` | Porta do backend no host | `3000` |
| `FRONTEND_PORT` | Porta do frontend no host | `5173` |
| `MONGO_ROOT_USER` | Usuário admin MongoDB | `admin` |
| `MONGO_ROOT_PASSWORD` | Senha MongoDB | `xrat_secret_2025` |
| `MONGO_DATABASE` | Nome do database | `xrat_db` |
| `REDIS_PASSWORD` | Senha Redis | `xrat_redis_2025` |
| `VITE_API_URL` | URL da API para frontend | `http://localhost:3000` |
| `FRONTEND_URL` | URL do frontend (CORS) | `http://localhost:5173` |

---

## 🤝 Contribuindo

1. Faça suas alterações
2. Teste localmente com `docker-compose up --build`
3. Commit suas mudanças
4. Envie um pull request

---

## 📄 Licença

MIT License

---

## 👨‍💻 Autor

Criado para o xRat Ecosystem Project

---

## 🎯 Próximos Passos

- [ ] Adicionar autenticação JWT
- [ ] Implementar mais endpoints da API
- [ ] Adicionar testes automatizados
- [ ] Configurar CI/CD
- [ ] Adicionar logs centralizados
- [ ] Implementar rate limiting
- [ ] Adicionar Swagger documentation

---

**Aproveite o xRat Ecosystem! 🐀✨**
