# xRat Ecosystem - Architecture Documentation

## 🏗️ System Overview

The xRat Ecosystem is a Docker-based isolated environment featuring a modern web application stack with comprehensive security and isolation.

```
┌─────────────────────────────────────────────────────────────┐
│                        Host Machine                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Docker Network (xrat-network)              │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────┐ │  │
│  │  │ Frontend │  │ Backend  │  │ MongoDB │  │ Redis│ │  │
│  │  │  React   │◄─┤  Express │◄─┤Database │  │Cache │ │  │
│  │  │   :5173  │  │   :3000  │  │ :27017  │  │:6379 │ │  │
│  │  └────┬─────┘  └─────┬────┘  └────┬────┘  └──┬───┘ │  │
│  │       │              │                │         │     │  │
│  │   Exposed        Exposed         Internal   Internal │  │
│  └──────│──────────────│────────────────────────────────┘  │
│         │              │                                     │
└─────────┼──────────────┼─────────────────────────────────────┘
          ↓              ↓
       Port 5173      Port 3000
```

## 🎯 Architecture Principles

1. **Isolation**: Services run in isolated Docker containers
2. **Security**: Database and cache are not exposed to the host
3. **Scalability**: Containerized architecture allows easy scaling
4. **Maintainability**: Clear separation of concerns
5. **Development-friendly**: Hot-reload enabled for rapid development

## 📦 Components

### Frontend (React + Vite)

**Technology Stack:**
- React 18.2
- Vite 5.0 (Build tool & Dev server)
- Modern ES6+ JavaScript

**Responsibilities:**
- User interface rendering
- API communication with backend
- Real-time status monitoring
- Data visualization

**Key Features:**
- Hot Module Replacement (HMR)
- Fast refresh during development
- Optimized production builds
- Environment-based configuration

**Port:** 5173 (Exposed)

### Backend (Node.js + Express)

**Technology Stack:**
- Node.js 20
- Express.js 4.18
- Mongoose (MongoDB ODM)
- Redis client
- Helmet (Security)
- CORS (Cross-Origin Resource Sharing)
- Compression (Response compression)

**Responsibilities:**
- RESTful API endpoints
- Database operations
- Cache management
- Business logic
- Authentication (future)
- Request validation

**Key Features:**
- Health check endpoints
- Graceful shutdown handling
- Error handling middleware
- Security headers
- Request compression

**Port:** 3000 (Exposed)

### MongoDB (Database)

**Technology Stack:**
- MongoDB 7.0
- Mongoose ODM

**Responsibilities:**
- Data persistence
- Document storage
- Query optimization
- Indexing

**Key Features:**
- ACID transactions
- Replica set ready
- Backup support
- Volume persistence

**Port:** 27017 (Internal only)

### Redis (Cache)

**Technology Stack:**
- Redis 7.2
- Redis Node.js client

**Responsibilities:**
- Data caching
- Session storage (future)
- Rate limiting (future)
- Pub/Sub messaging (future)

**Key Features:**
- In-memory storage
- Fast data access
- TTL support
- Persistence options

**Port:** 6379 (Internal only)

## 🌐 Network Architecture

### Docker Network: `xrat-network`

**Type:** Bridge network  
**Driver:** bridge  
**Subnet:** Auto-assigned by Docker

**Network Isolation:**
- All containers communicate on the same internal network
- Frontend ↔ Backend: HTTP/REST
- Backend ↔ MongoDB: MongoDB protocol
- Backend ↔ Redis: Redis protocol
- External access: Only Frontend (5173) and Backend (3000)

### Port Mapping

| Service   | Internal Port | External Port | Exposed |
|-----------|---------------|---------------|---------|
| Frontend  | 5173          | 5173          | ✅      |
| Backend   | 3000          | 3000          | ✅      |
| MongoDB   | 27017         | -             | ❌      |
| Redis     | 6379          | -             | ❌      |

## 🔄 Data Flow

### 1. User Request Flow

```
User → Frontend (React)
       ↓ HTTP Request
       Backend (Express)
       ↓ Query
       MongoDB / Redis
       ↓ Response
       Backend
       ↓ JSON Response
       Frontend
       ↓ Render
       User
```

### 2. Health Check Flow

```
External Monitor → Backend (/health)
                   ↓
                   Check MongoDB connection
                   Check Redis connection
                   ↓
                   Return status JSON
```

### 3. Cache Flow

```
Frontend → POST /api/data
           ↓
           Backend validates
           ↓
           Redis.set(key, value, TTL)
           ↓
           Success response
```

## 🗂️ Directory Structure

```
xRatEcosystem/
├── backend/
│   ├── src/
│   │   └── index.js           # Main Express application
│   ├── __tests__/             # Test files
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   ├── e2e/              # End-to-end tests
│   │   └── fixtures/         # Test data
│   ├── Dockerfile            # Backend container config
│   ├── package.json          # Dependencies
│   └── jest.config.js        # Test configuration
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # Entry point
│   │   └── test/             # Test utilities
│   ├── __tests__/            # Test files
│   │   ├── unit/             # Component tests
│   │   ├── integration/      # Integration tests
│   │   └── mocks/            # API mocks
│   ├── Dockerfile            # Frontend container config
│   ├── package.json          # Dependencies
│   └── vitest.config.js      # Test configuration
│
├── docs/                     # Documentation
├── .github/
│   ├── workflows/            # CI/CD workflows
│   └── copilot-instructions.md
├── docker-compose.yml        # Service orchestration
└── .env.example              # Environment template
```

## 🔐 Security Architecture

### Layer 1: Network Isolation

- MongoDB and Redis are not exposed to the host
- Only necessary ports are mapped
- Internal Docker network communication

### Layer 2: Application Security

- Helmet.js for security headers
- CORS configuration
- Input validation
- Environment variable management

### Layer 3: Container Security

- Non-root user execution (future)
- Read-only file systems (future)
- Resource limits (future)
- Security scanning

### Layer 4: Data Security

- MongoDB authentication required
- Redis password protection
- Encrypted connections (future)
- Data encryption at rest (future)

## 📊 Scalability Considerations

### Horizontal Scaling

**Current State:**
- Single instance per service
- Suitable for development and small deployments

**Future Enhancements:**
- Load balancer for multiple backend instances
- MongoDB replica sets
- Redis clustering
- Session affinity for stateful operations

### Vertical Scaling

**Resource Allocation:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Performance Optimization

1. **Caching Strategy**
   - Redis for frequently accessed data
   - TTL-based cache invalidation
   - Cache warming on startup

2. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Connection pooling

3. **Frontend Optimization**
   - Code splitting
   - Asset optimization
   - CDN integration (future)

## 🔄 Deployment Architecture

### Development Environment

- Docker Compose for local development
- Hot-reload enabled
- Development-specific configurations
- Debug logging enabled

### Staging Environment (Future)

- Similar to production
- Test data
- CI/CD automated deployment
- Integration testing

### Production Environment (Future)

- Kubernetes orchestration
- High availability
- Auto-scaling
- Monitoring and alerting
- Backup and disaster recovery

## 🛠️ Technology Decisions

### Why Docker?

- **Consistency**: Same environment across development, staging, and production
- **Isolation**: Services don't interfere with each other
- **Portability**: Easy to move between environments
- **Scalability**: Simple to add more instances

### Why Express.js?

- **Simplicity**: Minimal, unopinionated framework
- **Flexibility**: Easy to customize
- **Ecosystem**: Large npm ecosystem
- **Performance**: Fast and lightweight

### Why React?

- **Component-based**: Reusable UI components
- **Virtual DOM**: Efficient rendering
- **Ecosystem**: Large community and libraries
- **Developer Experience**: Excellent tooling

### Why MongoDB?

- **Schema flexibility**: Easy to iterate
- **JSON-native**: Works well with JavaScript
- **Scalability**: Built for horizontal scaling
- **Performance**: Fast reads and writes

### Why Redis?

- **Speed**: In-memory storage
- **Versatility**: Cache, session store, pub/sub
- **Simplicity**: Easy to use
- **Reliability**: Battle-tested

## 📈 Monitoring & Observability

### Health Checks

**Endpoints:**
- `GET /health` - Basic health status
- `GET /health/ready` - Readiness probe (future)
- `GET /health/live` - Liveness probe (future)

### Logging

**Backend:**
- Console logging (development)
- Structured logging with Winston (future)
- Log aggregation (future)

**Frontend:**
- Console logging (development)
- Error tracking (future)

### Metrics

**Application Metrics:**
- Request count
- Response time
- Error rate
- Cache hit/miss ratio (future)

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

## 🚀 Future Enhancements

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - OAuth integration

2. **API Gateway**
   - Rate limiting
   - Request throttling
   - API versioning

3. **Microservices**
   - Service decomposition
   - Service mesh
   - API composition

4. **Message Queue**
   - RabbitMQ or Kafka
   - Asynchronous processing
   - Event-driven architecture

5. **Kubernetes Deployment**
   - Container orchestration
   - Auto-scaling
   - Service discovery
   - Load balancing

---

**Last Updated:** 2025-01-03  
**Version:** 1.0.0  
**Maintainer:** xRat Ecosystem Team
