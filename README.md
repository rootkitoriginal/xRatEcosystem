# 🐀 xRat Ecosystem

[![Tests](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/test.yml/badge.svg)](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/test.yml)
[![Build](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/build.yml/badge.svg)](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/build.yml)
[![CodeQL](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/codeql.yml/badge.svg)](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10-blue.svg)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

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
- **API Documentation**: http://localhost:3000/api-docs 📚
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

### 📚 Interactive API Documentation (Swagger UI)

**Access comprehensive API documentation at: http://localhost:3000/api-docs**

The API documentation includes:

- ✅ All endpoints with detailed descriptions
- ✅ Request/response examples
- ✅ Authentication requirements (JWT Bearer token)
- ✅ Error codes and handling
- ✅ Try out endpoints directly from your browser
- ✅ OpenAPI 3.0 specification

### Backend API

O backend fornece uma API RESTful completa com os seguintes recursos:

#### Health & Status

- `GET /` - Informações básicas da API
- `GET /health` - Health check do sistema
- `GET /api/status` - Status detalhado de todos os serviços

#### Authentication

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/logout` - Logout de usuário (protegido)
- `GET /api/auth/profile` - Obter perfil do usuário (protegido)

#### Data Management (Protegido)

- `POST /api/data` - Criar nova entidade de dados
- `GET /api/data` - Listar todos os dados (paginado)
- `GET /api/data/:id` - Obter dados por ID (com cache)
- `PUT /api/data/:id` - Atualizar dados por ID
- `DELETE /api/data/:id` - Deletar dados por ID
- `GET /api/data/search` - Buscar dados com filtros
- `POST /api/data/bulk` - Operações em massa (criar/atualizar/deletar)
- `GET /api/data/export` - Exportar dados (JSON/CSV)
- `GET /api/data/analytics` - Obter analytics dos dados

### Exemplo de Uso

````bash
# Health check
curl http://localhost:3000/health

# Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user",
    "email": "user@example.com",
    "password": "Password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'

<<<<<<< HEAD
```bash
curl http://localhost:3000/api/status
````

#### POST `/api/data`

Salvar dados no Redis cache (requires authentication)

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"key": "test", "value": "Hello xRat!"}'
```

#### GET `/api/data/:key`

Recuperar dados do Redis cache (requires authentication)

```bash
curl http://localhost:3000/api/data/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

=======

# Criar dados (requer token)

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Data",
    "content": {"key": "value"},
    "type": "json",
    "tags": ["important"]
  }'

# Listar dados (requer token)
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/data?page=1&limit=10"
```

Para documentação completa da API, consulte [docs/API.md](docs/API.md) ou acesse a interface interativa:

**For complete API documentation, visit http://localhost:3000/api-docs**

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

| Variável              | Descrição                 | Padrão                  |
| --------------------- | ------------------------- | ----------------------- |
| `NODE_ENV`            | Ambiente Node.js          | `development`           |
| `BACKEND_PORT`        | Porta do backend no host  | `3000`                  |
| `FRONTEND_PORT`       | Porta do frontend no host | `5173`                  |
| `MONGO_ROOT_USER`     | Usuário admin MongoDB     | `admin`                 |
| `MONGO_ROOT_PASSWORD` | Senha MongoDB             | `xrat_secret_2025`      |
| `MONGO_DATABASE`      | Nome do database          | `xrat_db`               |
| `REDIS_PASSWORD`      | Senha Redis               | `xrat_redis_2025`       |
| `VITE_API_URL`        | URL da API para frontend  | `http://localhost:3000` |
| `FRONTEND_URL`        | URL do frontend (CORS)    | `http://localhost:5173` |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](docs/CONTRIBUTING.md) antes de submeter pull requests.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Faça commit das suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

Veja também:

- [Guia de Testes](docs/TESTING.md)
- [Documentação da API](docs/API.md)
- [Arquitetura](docs/ARCHITECTURE.md)

---

## 📚 Documentação

- [📖 Architecture](docs/ARCHITECTURE.md) - Arquitetura do sistema
- [📡 API Documentation](docs/API.md) - Documentação dos endpoints
- [🧪 Testing Guide](docs/TESTING.md) - Guia de testes
- [🤝 Contributing](docs/CONTRIBUTING.md) - Como contribuir
- [🚀 Deployment](docs/DEPLOYMENT.md) - Guia de deployment
- [🔐 Security](docs/SECURITY.md) - Políticas de segurança
- [📝 ACT Testing](docs/ACT_TESTING.md) - Teste local de workflows

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 Contribuidores

Agradecimentos a todos que contribuíram para este projeto:

<a href="https://github.com/xLabInternet/xRatEcosystem/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=xLabInternet/xRatEcosystem" />
</a>

---

## 📊 Status do Projeto

- ✅ **Fase 1:** Setup inicial e infraestrutura básica - Completo
- ✅ **Fase 2:** Testes, documentação e CI/CD - Completo
- ⏳ **Fase 3:** Autenticação e autorização - Em planejamento
- ⏳ **Fase 4:** Features avançadas - Em planejamento

---

## 🔗 Links Úteis

- [GitHub Repository](https://github.com/xLabInternet/xRatEcosystem)
- [Issue Tracker](https://github.com/xLabInternet/xRatEcosystem/issues)
- [Pull Requests](https://github.com/xLabInternet/xRatEcosystem/pulls)
- [Changelog](CHANGELOG.md)

---

## 📞 Suporte

Precisa de ajuda?

- 📖 Confira a [documentação](docs/)
- 🐛 Abra uma [issue](https://github.com/xLabInternet/xRatEcosystem/issues)
- 💬 Participe das [discussões](https://github.com/xLabInternet/xRatEcosystem/discussions)

---

**Desenvolvido com ❤️ para a comunidade | xRat Ecosystem 🐀✨**
