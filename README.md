# 🐀 xRat Ecosystem

[![Tests](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/test.yml/badge.svg)](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/test.yml)
[![Build](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/build.yml/badge.svg)](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/build.yml)
[![CodeQL](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/codeql.yml/badge.svg)](https://github.com/xLabInternet/xRatEcosystem/actions/workflows/codeql.yml)
[![Coverage](https://img.shields.io/badge/coverage-82.2%25-brightgreen.svg)](https://github.com/xLabInternet/xRatEcosystem)
[![Tests](https://img.shields.io/badge/tests-220%20passing-brightgreen.svg)](https://github.com/xLabInternet/xRatEcosystem)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10-blue.svg)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

Um ambiente Docker isolado completo com Node.js, MongoDB, Redis, Backend API e Frontend React com **cobertura de testes profissional**.

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
✅ **WebSocket real-time communication** com Socket.IO  
✅ **Cobertura de testes profissional com 220 testes passando**

### 🧪 Status dos Testes

- **🎯 Cobertura Total**: 82.2% (acima do threshold recomendado)
- **📊 Total de Testes Funcionais**: 571 testes executando com sucesso
- **🚀 Testes de Performance**: 38 testes de estresse e carga (NEW)
- **⚡ Performance**: 5.2s tempo de execução (testes funcionais)
- **🔧 Middleware**: 100% de cobertura (auth, rateLimiter, requestLogger)
- **📦 Models**: Cobertura significativa (Data: 75%, User: 59%)
- **🔌 WebSocket**: 150 testes funcionais + 38 testes de performance
- **✅ Test Suites**: 31 suítes de teste implementadas (27 funcionais + 4 performance)

---

## 🏗️ Estrutura do Projeto

```
xRatEcosystem/
├── 📁 backend/                    # Backend Node.js + Express
│   ├── 📁 src/                   # Código fonte principal
│   │   ├── index.js              # Entry point da API
│   │   ├── openapi.yaml          # Documentação OpenAPI/Swagger
│   │   ├── 📁 auth/              # Sistema de autenticação
│   │   │   ├── authController.js # Controller de autenticação
│   │   │   └── authRoutes.js     # Rotas de auth
│   │   ├── 📁 config/            # Configurações
│   │   │   └── logger.js         # Configuração Winston
│   │   ├── 📁 controllers/       # Controllers da API
│   │   │   └── dataController.js # Controller de dados
│   │   ├── 📁 health/            # Health checks
│   │   │   ├── healthRouter.js   # Rotas de health
│   │   │   ├── healthService.js  # Serviço de health
│   │   │   └── index.js          # Exportações
│   │   ├── 📁 middleware/        # Middlewares Express
│   │   │   ├── auth.js           # Middleware de autenticação
│   │   │   ├── rateLimiter.js    # Rate limiting
│   │   │   └── requestLogger.js  # Logging de requests
│   │   ├── 📁 models/            # Modelos Mongoose
│   │   │   ├── Data.js           # Model de dados
│   │   │   └── User.js           # Model de usuário
│   │   ├── 📁 routes/            # Definições de rotas
│   │   │   └── dataRoutes.js     # Rotas de dados
│   │   ├── 📁 services/          # Serviços de negócio
│   │   │   └── dataService.js    # Serviço de dados
│   │   ├── 📁 utils/             # Utilitários
│   │   │   ├── jwt.js            # Utilities JWT
│   │   │   └── validation.js     # Validações
│   │   └── 📁 websocket/         # WebSocket real-time
│   │       ├── socketService.js  # Serviço Socket.IO
│   │       └── index.js          # Exportações
│   ├── 📁 __tests__/             # Testes principais
│   │   ├── 📁 integration/       # Testes de integração
│   │   │   ├── api.test.js       # Testes gerais da API
│   │   │   ├── auth.test.js      # Testes de autenticação
│   │   │   ├── data.test.js      # Testes de dados
│   │   │   ├── rateLimiter.test.js # Testes rate limiting
│   │   │   └── swagger.test.js   # Testes documentação
│   │   └── 📁 unit/              # Testes unitários
│   │       ├── auth.test.js      # Middleware auth
│   │       ├── logger.test.js    # Sistema de logging
│   │       ├── 📁 websocket/     # Testes WebSocket
│   │       │   └── socketService.test.js # Serviço Socket.IO
│   │       ├── rateLimiter.test.js # Rate limiter
│   │       ├── requestLogger.test.js # Request logger
│   │       └── 📁 models/        # Testes de modelos
│   │           ├── Data.test.js  # Testes Data model
│   │           └── User.test.js  # Testes User model
│   ├── 📁 tests/                 # Testes específicos
│   │   ├── 📁 integration/       # Testes de integração
│   │   └── 📁 unit/              # Testes unitários
│   ├── 📁 coverage/              # Relatórios de cobertura
│   ├── 📁 logs/                  # Arquivos de log
│   ├── 📁 docs/                  # Documentação específica
│   ├── Dockerfile                # Container backend
│   ├── package.json              # Dependências Node.js
│   ├── jest.config.js            # Configuração Jest
│   └── eslint.config.js          # Configuração ESLint
├── 📁 frontend/                   # Frontend React + Vite
│   ├── 📁 src/                   # Código fonte React
│   │   ├── App.jsx               # Componente principal
│   │   ├── App.css               # Estilos principais
│   │   ├── main.jsx              # Entry point React
│   │   ├── index.css             # Estilos globais
│   │   ├── 📁 components/        # Componentes React
│   │   │   ├── 📁 auth/          # Componentes autenticação
│   │   │   └── 📁 data/          # Componentes dados
│   │   ├── 📁 contexts/          # Contextos React
│   │   │   └── AuthContext.jsx   # Context de autenticação
│   │   ├── 📁 pages/             # Páginas/Views
│   │   │   ├── AuthPage.jsx      # Página de autenticação
│   │   │   ├── Dashboard.jsx     # Dashboard principal
│   │   │   ├── DataManagement.jsx # Gerenciamento dados
│   │   │   └── DataManagement.css # Estilos dados
│   │   ├── 📁 services/          # Serviços API
│   │   │   ├── mockAuth.js       # Mock autenticação
│   │   │   └── mockDataService.js # Mock dados
│   │   └── 📁 test/              # Utilitários de teste
│   ├── 📁 __tests__/             # Testes frontend
│   │   └── 📁 unit/              # Testes unitários React
│   │       ├── App.test.jsx      # Testes App component
│   │       ├── 📁 auth/          # Testes componentes auth
│   │       └── 📁 data/          # Testes componentes data
│   ├── 📁 coverage/              # Relatórios cobertura
│   ├── index.html                # Template HTML
│   ├── vite.config.js            # Configuração Vite
│   ├── vitest.config.js          # Configuração Vitest
│   ├── Dockerfile                # Container frontend
│   └── package.json              # Dependências React
├── 📁 docs/                       # Documentação completa
│   ├── README.md                 # Índice documentação
│   ├── ARCHITECTURE.md           # Arquitetura sistema
│   ├── API.md                    # Documentação API
│   ├── TESTING.md                # Guia de testes
│   ├── CONTRIBUTING.md           # Guia contribuição
│   ├── DEPLOYMENT.md             # Guia deployment
│   ├── SECURITY.md               # Políticas segurança
│   └── ACT_TESTING.md            # Testes locais
├── 📁 .github/                    # GitHub workflows e templates
│   ├── 📁 workflows/             # GitHub Actions
│   └── 📁 ISSUE_TEMPLATE/        # Templates issues/PRs
├── 📁 bin/                        # Scripts utilitários
│   ├── gemini-helper.js          # Helper Gemini CLI
│   ├── monitorDevOps.js          # Monitor DevOps
│   └── README.md                 # Documentação scripts
├── 📁 .husky/                     # Git hooks
├── docker-compose.yml            # Orquestração containers
├── package.json                  # Scripts raiz projeto
├── .env.example                  # Template variáveis ambiente
├── .gitignore                    # Arquivos ignorados Git
├── .prettierrc                   # Configuração Prettier
├── .editorconfig                 # Configuração editor
├── CHANGELOG.md                  # Histórico mudanças
├── LICENSE                       # Licença MIT
├── QUICKSTART.md                 # Guia início rápido
├── GEMINI.md                     # Context AI assistant
└── README.md                     # Este arquivo
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

### Executar Testes

```bash
# Testes do backend (Jest)
npm run test --prefix backend

# Testes com cobertura
npm run test:coverage --prefix backend

# Testes do frontend (Vitest)
npm run test --prefix frontend

# Testes de integração E2E
npm run test:e2e --prefix frontend

# Testes em modo watch (desenvolvimento)
npm run test:watch --prefix backend

# Executar testes de performance e estresse (NEW)
npm run test:performance --prefix backend

# Executar testes de performance específicos
npm run test:performance:stress --prefix backend      # Testes de conexão
npm run test:performance:memory --prefix backend      # Detecção de memory leaks
npm run test:performance:throughput --prefix backend  # Throughput de mensagens
npm run test:performance:resources --prefix backend   # Exaustão de recursos
```

**📊 Testes de Performance** (NEW):
- 38 testes de estresse e carga
- Validação de 100+ conexões simultâneas
- Detecção de memory leaks
- Benchmarks de throughput (500-1000 msg/sec)
- Testes de exaustão de recursos
- Documentação completa: `docs/WEBSOCKET_PERFORMANCE_TESTING.md`

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
- ✅ **Suite de testes abrangente (146 testes)**

#### Arquitetura de Testes Backend

```
backend/__tests__/
├── integration/          # Testes de integração HTTP
│   ├── api.test.js      # Testes gerais da API
│   ├── auth.test.js     # Testes de autenticação
│   ├── data.test.js     # Testes de gerenciamento de dados
│   ├── rateLimiter.test.js  # Testes de rate limiting
│   └── swagger.test.js  # Testes da documentação API
├── unit/                # Testes unitários
│   ├── auth.test.js     # Middleware de autenticação
│   ├── logger.test.js   # Sistema de logging
│   ├── rateLimiter.test.js  # Rate limiter middleware
│   ├── requestLogger.test.js  # Middleware de logging
│   └── models/          # Testes dos modelos
│       ├── Data.test.js # Modelo de dados (29 testes)
│       └── User.test.js # Modelo de usuário (30 testes)
└── tests/               # Testes específicos
    ├── integration/
    │   └── healthEndpoints.test.js
    └── unit/
        └── healthService.test.js
```

### Frontend (React + Vite)

O frontend está em `./frontend/src/` e inclui:

- ✅ React 18
- ✅ Vite para desenvolvimento rápido
- ✅ Interface para testar a API
- ✅ Dashboard de status dos serviços
- ✅ Hot-reload ativado
- ✅ **Suite de testes com Vitest (59 testes)**

#### Arquitetura de Testes Frontend

```
frontend/__tests__/
└── unit/                # Testes unitários React
    ├── App.test.jsx     # Componente principal
    ├── auth/           # Testes de componentes auth
    └── data/           # Testes de componentes data
```

**Tecnologias de teste:**

- **Vitest** - Framework de testes rápido
- **@testing-library/react** - Testes de componentes
- **@testing-library/user-event** - Simulação de interações
- **jsdom** - Ambiente DOM para testes

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
- [🔌 WebSocket Guide](docs/WEBSOCKET.md) - Real-time communication
- [🔧 Redis Resilience](docs/REDIS_RESILIENCE.md) - Padrões de resiliência e testes de edge cases do Redis
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

- ✅ **Fase 1:** Setup inicial e infraestrutura básica - **Completo**
- ✅ **Fase 2:** Testes, documentação e CI/CD - **Completo**
- ✅ **Fase 2.5:** Comprehensive Testing Suite - **Completo** (220 testes)
- 🟡 **Fase 3:** Production Features (Health Checks) - **Em Progresso**
- 🟡 **Fase 4:** Authentication System (JWT Backend + UI) - **Em Progresso**
- ⏳ **Fase 5:** Data Management API - **Planejado**
- ✅ **Fase 6:** WebSocket & Real-time Features - **Completo**

### 🎯 Últimas Conquistas

- **Issue #20** - WebSocket Real-time Communication ✅
  - Socket.IO v4.7.5 integration
  - JWT authentication for WebSocket
  - Room-based messaging system
  - Offline message queuing with Redis
  - Rate limiting (100 msgs/min)
  - 15 comprehensive unit tests
- **PR #36** - Middleware Testing Suite (100% coverage) ✅
- **PR #37** - Model Testing Suite (significativo aumento de coverage) ✅
- **220 testes** implementados com sucesso
- **82.2% cobertura** total do backend
- **Middleware**: 100% de cobertura (auth, rateLimiter, requestLogger)
- **Models**: Data.js (75%), User.js (59%)

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

# CI Test Trigger
