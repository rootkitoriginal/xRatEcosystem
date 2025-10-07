# 🐀 xRat Ecosystem

> Sistema completo de monitoramento e gerenciamento com arquitetura moderna usando Docker, Node.js, React e MongoDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.2-blue)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/docker-required-blue)](https://www.docker.com/)

## 📋 Visão Geral

O xRat Ecosystem é uma plataforma full-stack para gerenciamento de dados em tempo real, com:

- 🔐 **Autenticação JWT** - Sistema seguro de login e autorização
- 📊 **Dashboard em Tempo Real** - Monitoramento via WebSockets
- 🚀 **API RESTful Versionada** - API v1 estável, v2 planejada
- 💾 **MongoDB + Redis** - Persistência e cache de alta performance
- 🐳 **Containerizado** - Deploy fácil com Docker Compose
- 🧪 **100% Testado** - 634+ testes automatizados
- 📝 **Documentação Completa** - Swagger UI integrado

## 🚀 Início Rápido

### Pré-requisitos

- Docker 20+ e Docker Compose
- Git
- (Opcional) Node.js 20+ para desenvolvimento local

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/xLabInternet/xRatEcosystem.git
cd xRatEcosystem

# 2. Inicie o sistema (usa xrat.sh - NÃO use docker-compose diretamente)
./xrat.sh start

# 3. Acompanhe os logs
./xrat.sh logs
```

### Acesso aos Serviços

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:3000>
- **API Docs (Swagger)**: <http://localhost:3000/api-docs>
- **Health Check**: <http://localhost:3000/health>

## 📖 Documentação

### Essencial

- **[Quick Start](./docs/QUICKSTART.md)** - Primeiros passos em 5 minutos
- **[xrat.sh Guide](./docs/XRAT_SCRIPT_GUIDE.md)** - Guia completo do script de gerenciamento
- **[API Documentation](./docs/API.md)** - Referência completa da API
- **[API Versioning](./docs/API_VERSIONING.md)** - Estratégia de versionamento

### Desenvolvimento

- **[Backend Setup](./docs/backend-setup.md)** - Configuração do backend Node.js
- **[Frontend Setup](./docs/frontend-setup.md)** - Configuração do frontend React
- **[Contributing](./docs/CONTRIBUTING.md)** - Como contribuir
- **[Architecture](./docs/ARCHITECTURE.md)** - Arquitetura do sistema

### Testing & CI/CD

- **[Testing Guide](./docs/TESTING.md)** - Guia de testes
- **[CI Validation](./docs/ci-validation.md)** - Validação de CI/CD
- **[Performance Testing](./docs/performance-testing.md)** - Testes de performance

### Todos os Documentos

Acesse **[docs/README.md](./docs/README.md)** para o índice completo da documentação.

## 🛠️ Gerenciamento com xrat.sh

> ⚠️ **IMPORTANTE**: Sempre use `./xrat.sh` ao invés de comandos Docker diretos!

### Comandos Principais

```bash
./xrat.sh start          # Iniciar todos os serviços
./xrat.sh stop           # Parar todos os serviços
./xrat.sh restart        # Reiniciar todos (ou específico: restart backend)
./xrat.sh logs           # Ver logs em tempo real (ou específico: logs backend)
./xrat.sh status         # Ver status de todos os serviços
./xrat.sh clean          # Limpar tudo (⚠️ remove dados!)
./xrat.sh rebuild        # Reconstruir imagens Docker
./xrat.sh help           # Ver ajuda completa
```

**Documentação completa**: [XRAT_SCRIPT_GUIDE.md](./docs/XRAT_SCRIPT_GUIDE.md)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                     Cliente                          │
│              (Browser / Mobile App)                  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│                  NGINX (Reverse Proxy)               │
│              SSL/TLS + Rate Limiting                 │
└─────────┬───────────────────────────────────────────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
┌────────┐  ┌──────────────────────────┐
│Frontend│  │  Backend API (Node.js)   │
│ React  │  │   Express + JWT Auth     │
│ Vite   │  │   /api/v1/* (stable)     │
└────────┘  │   /api/v2/* (planned)    │
            └─────┬────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌────────────┐      ┌───────────────┐
│  MongoDB   │      │  Redis Cache  │
│  Database  │      │  + WebSocket  │
└────────────┘      └───────────────┘
```

### Componentes

| Serviço  | Tecnologia      | Porta   | Descrição                |
| -------- | --------------- | ------- | ------------------------ |
| nginx    | Nginx 1.29      | 80, 443 | Reverse proxy + SSL      |
| backend  | Node.js 20      | 3000    | API REST + WebSocket     |
| frontend | React 18 + Vite | 5173    | Interface do usuário     |
| mongodb  | MongoDB 7       | 27017   | Banco de dados (interno) |
| redis    | Redis 7         | 6379    | Cache + PubSub (interno) |

## 🔐 Segurança

- ✅ **Autenticação JWT** com refresh tokens
- ✅ **Rate Limiting** por IP e endpoint
- ✅ **Helmet.js** para headers de segurança
- ✅ **CORS** configurado corretamente
- ✅ **MongoDB e Redis** não expostos publicamente
- ✅ **Logs auditados** com Winston
- ✅ **SSL/TLS** via nginx

## 🧪 Testes

### Executar Testes

```bash
# Backend (634 testes)
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### Cobertura

- **Backend**: 634+ testes (unit + integration)
- **Frontend**: Unit tests com Vitest
- **E2E**: 75+ testes Playwright (Chrome/Chromium)
  - Autenticação completa (login, registro, sessões)
  - CRUD de dados (criar, ler, atualizar, deletar)
  - WebSocket em tempo real
  - Perfis de usuário
  - Segurança e controle de acesso
  - Resiliência e tratamento de falhas
- **Performance**: k6 load tests

📖 **[Guia Completo de Testes E2E](./__tests__/e2e/README.md)**

## 📦 API Endpoints

### Versionamento

A API usa versionamento por URL:

- `/api/v1/*` - Versão 1 (estável)
- `/api/v2/*` - Versão 2 (planejada para 2026-Q1)
- `/api/versions` - Informações sobre versões disponíveis

### Principais Endpoints v1

#### Autenticação

```
POST   /api/v1/auth/register    # Registrar usuário
POST   /api/v1/auth/login        # Login
POST   /api/v1/auth/refresh      # Refresh token
POST   /api/v1/auth/logout       # Logout
GET    /api/v1/auth/profile      # Perfil do usuário
```

#### Gerenciamento de Dados

```
GET    /api/v1/data              # Listar dados (paginado)
POST   /api/v1/data              # Criar dado
GET    /api/v1/data/:id          # Obter por ID (cached)
PUT    /api/v1/data/:id          # Atualizar
DELETE /api/v1/data/:id          # Deletar
GET    /api/v1/data/search       # Buscar
POST   /api/v1/data/bulk         # Operações em lote
```

#### Health & Status

```
GET    /health                   # Health check simples
GET    /api/v1/health           # Health check detalhado
GET    /api/v1/status           # Status do sistema
GET    /api/v1/websocket/stats  # Estatísticas WebSocket
```

### Documentação Interativa

Acesse **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)** para:

- 📖 Ver todos os endpoints
- 🧪 Testar APIs diretamente no browser
- 📋 Ver exemplos de request/response
- 🔐 Testar com autenticação

## 🔄 WebSocket Real-time

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:3000');

// Escutar eventos
socket.on('notification', (data) => {
  console.log('Nova notificação:', data);
});

// Emitir eventos
socket.emit('subscribe', { topic: 'updates' });
```

Ver [WEBSOCKET.md](./docs/WEBSOCKET.md) para documentação completa.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Leia o [Contributing Guide](./docs/CONTRIBUTING.md)
2. Siga as [Commit Conventions](./docs/commit-conventions.md)
3. Abra Issues para bugs/features
4. Crie Pull Requests com testes

### Workflow de Desenvolvimento

```bash
# 1. Fork e clone o repositório
git clone https://github.com/YOUR_USERNAME/xRatEcosystem.git

# 2. Crie uma branch
git checkout -b feature/minha-feature

# 3. Inicie o ambiente
./xrat.sh start

# 4. Faça mudanças e teste
npm test

# 5. Commit com convenção
git commit -m "feat: adiciona nova feature"

# 6. Push e abra PR
git push origin feature/minha-feature
```

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Express.js community
- React community
- Docker community
- Todos os contribuidores

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/xLabInternet/xRatEcosystem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xLabInternet/xRatEcosystem/discussions)
- **Documentação**: [docs/](./docs/)

---

**Desenvolvido com ❤️ pelo time xLab Internet**

**Última atualização**: 7 de outubro de 2025
