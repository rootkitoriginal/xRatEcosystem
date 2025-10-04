# xRat Ecosystem - Gemini AI Assistant Context

## Project Overview

**xRat Ecosystem** is a Docker-based isolated development environment featuring a complete full-stack application with Node.js backend, React frontend, MongoDB database, and Redis cache.

### Key Characteristics
- **Architecture**: Microservices with isolated Docker containers
- **Language**: Primarily JavaScript/TypeScript
- **Backend**: Node.js + Express.js
- **Frontend**: React 18 + Vite
- **Database**: MongoDB (internal network only)
- **Cache**: Redis (internal network only)
- **Deployment**: Docker Compose orchestration

## Current Development Phase

**Phase 2: Testing, Documentation & CI/CD** (Branch: `feature/testing-docs-workflows`)

We are currently implementing:
1. Comprehensive testing infrastructure (Jest, Vitest, Playwright)
2. Technical documentation (API, Architecture, Contributing guides)
3. CI/CD workflows with GitHub Actions
4. Code quality tools (ESLint, Prettier, Husky)
5. Local testing with `act` (GitHub Actions runner)

## Project Structure

```
xRatEcosystem/
├── .github/
│   ├── copilot-instructions.md     # Detailed project roadmap
│   └── workflows/                   # GitHub Actions workflows
│       ├── gemini-dispatch.yml      # Central AI dispatcher
│       ├── gemini-invoke.yml        # General assistant
│       ├── gemini-review.yml        # PR reviews
│       ├── gemini-triage.yml        # Issue triage
│       └── gemini-scheduled-triage.yml
├── backend/
│   ├── src/
│   │   └── index.js                # Express API server
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main React component
│   │   └── main.jsx                # Entry point
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── README.md                   # Documentation index
│   └── ACT_TESTING.md              # Local workflow testing guide
├── docker-compose.yml              # Service orchestration
├── .actrc                          # Local testing config
└── GEMINI.md                       # This file
```

## Coding Standards & Conventions

### Branch Naming
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `test/*` - Test implementations
- `chore/*` - Maintenance tasks

### Commit Messages (Semantic Commits)
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Examples:
  feat(backend): Add user authentication endpoint
  fix(frontend): Resolve navigation state bug
  docs: Update API documentation
  test(backend): Add integration tests for auth
```

### Code Style
- **JavaScript/JSX**: Use ES6+ features, async/await
- **Indentation**: 2 spaces (enforced by Prettier)
- **Quotes**: Single quotes for JS, double for JSX attributes
- **Semicolons**: Required
- **Line Length**: Max 100 characters

### File Organization
- **Components**: One component per file
- **Naming**: PascalCase for components, camelCase for utilities
- **Exports**: Named exports preferred over default exports
- **Tests**: Co-located with source files or in `__tests__/` directories

## Docker & Networking

### Network Isolation
```yaml
Services:
  - backend (exposed: 3000)
  - frontend (exposed: 5173)
  - mongodb (internal only)
  - redis (internal only)

Network: xrat-network (bridge)
```

### Important Rules
1. **Never expose MongoDB or Redis ports** to the host
2. **Always use service names** for inter-container communication
3. **Environment variables** stored in `.env` (never commit!)
4. **Secrets** managed via GitHub Secrets for CI/CD

## API Design Principles

### RESTful Conventions
```javascript
GET    /api/resource        # List all
GET    /api/resource/:id    # Get one
POST   /api/resource        # Create
PUT    /api/resource/:id    # Update
DELETE /api/resource/:id    # Delete
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2025-10-03T21:00:00Z"
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "ERR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "timestamp": "2025-10-03T21:00:00Z"
}
```

## Testing Philosophy

### Test Pyramid
1. **Unit Tests (70%)**: Individual functions, components
2. **Integration Tests (20%)**: API endpoints, component interactions
3. **E2E Tests (10%)**: Complete user flows

### Coverage Requirements
- **Minimum**: 80% code coverage
- **Focus**: Critical paths, business logic, edge cases
- **Tools**: Jest (backend), Vitest (frontend), Playwright (E2E)

### Test File Naming
```
src/utils/helper.js          → __tests__/helper.test.js
src/components/Button.jsx    → __tests__/Button.test.jsx
```

## Security Best Practices

### Secrets Management
- ✅ Use `.env` files locally (git-ignored)
- ✅ Use GitHub Secrets for CI/CD
- ✅ Never hardcode credentials
- ✅ Rotate API keys regularly

### Dependencies
- Review security advisories monthly
- Update dependencies regularly
- Use `npm audit` to check vulnerabilities
- Pin versions in production

### Code Review Requirements
- All PRs require review before merge
- Check for exposed secrets/credentials
- Verify input validation
- Review authentication/authorization

## GitHub Actions Workflows

### Available Workflows
1. **gemini-dispatch.yml**: Routes `@gemini-cli` commands
2. **gemini-review.yml**: Automated PR reviews
3. **gemini-triage.yml**: Issue triage and labeling
4. **gemini-invoke.yml**: General AI assistance
5. **gemini-scheduled-triage.yml**: Scheduled issue management

### Triggering Workflows
```bash
# In PR or Issue comments:
@gemini-cli /review              # Review code changes
@gemini-cli /triage              # Triage issue
@gemini-cli explain this code    # General help
@gemini-cli write tests for X    # Generate tests
```

## Local Development

### Setup Commands
```bash
# Clone and setup
git clone https://github.com/rootkitoriginal/xRatEcosystem.git
cd xRatEcosystem
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Testing Locally with act
```bash
# List workflows
act --list

# Test workflow (dry run)
act -n issues -W .github/workflows/gemini-triage.yml

# Run workflow
act workflow_dispatch -W .github/workflows/gemini-scheduled-triage.yml
```

### Development URLs
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- API Health: http://localhost:3000/health

## Common Tasks

### Adding a New API Endpoint
1. Create route handler in `backend/src/routes/`
2. Add middleware if needed
3. Update API documentation
4. Write unit and integration tests
5. Test manually with Postman/curl
6. Update `docs/API.md`

### Adding a New React Component
1. Create component in `frontend/src/components/`
2. Write PropTypes or TypeScript types
3. Add unit tests with React Testing Library
4. Update Storybook if applicable
5. Document props and usage

### Running Tests
```bash
# Backend
cd backend && npm test
npm run test:coverage

# Frontend
cd frontend && npm test
npm run test:ui
npm run test:e2e
```

## Documentation Expectations

### Code Comments
- **When**: Complex logic, non-obvious decisions, workarounds
- **Style**: Clear, concise, explain "why" not "what"
- **JSDoc**: Required for public functions/classes

### PR Descriptions
Include:
- What changed and why
- Testing performed
- Screenshots for UI changes
- Migration notes if applicable
- Related issues/tickets

### Documentation Updates
When changing:
- API endpoints → Update `docs/API.md`
- Architecture → Update `docs/ARCHITECTURE.md`
- Setup process → Update `README.md` and `QUICKSTART.md`
- Testing → Update `docs/TESTING.md`

## Performance Considerations

### Backend
- Use Redis for caching frequently accessed data
- Implement database indexes for common queries
- Use connection pooling for MongoDB
- Implement request rate limiting
- Monitor memory usage and optimize queries

### Frontend
- Lazy load routes and components
- Optimize images and assets
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Monitor bundle size with Vite analyzer

## Troubleshooting

### Common Issues

**Docker containers won't start**
```bash
docker-compose down -v
docker-compose up -d --build
```

**MongoDB connection errors**
- Verify `MONGO_ROOT_USER` and `MONGO_ROOT_PASSWORD` in `.env`
- Check service name is `mongodb` in connection string
- Ensure services are on same Docker network

**Port conflicts**
```bash
# Find process using port
lsof -i :3000
# Kill process or change port in .env
```

**Workflow test failures with act**
- Verify `.secrets` file exists and has correct format
- Check Docker is running
- Use `-v` flag for verbose output
- Review act documentation at `docs/ACT_TESTING.md`

## AI Assistant Guidelines

### When Reviewing Code
1. Check adherence to project structure and conventions
2. Verify security best practices (no exposed secrets)
3. Ensure proper error handling
4. Validate test coverage for new code
5. Check documentation updates
6. Verify commit message format

### When Triaging Issues
1. Check if issue is clear and reproducible
2. Suggest appropriate labels (bug, enhancement, documentation)
3. Identify if it's a duplicate
4. Recommend priority based on impact
5. Suggest potential solutions or workarounds

### When Providing Code Suggestions
1. Follow existing code style and patterns
2. Include error handling
3. Add appropriate comments
4. Suggest relevant tests
5. Consider performance implications
6. Maintain backward compatibility

## Resources

- **GitHub Repository**: https://github.com/rootkitoriginal/xRatEcosystem
- **Documentation**: `/docs` directory
- **Phase 2 Roadmap**: `.github/copilot-instructions.md`
- **Local Testing Guide**: `docs/ACT_TESTING.md`
- **Quick Start**: `QUICKSTART.md`

## Project Goals

**Short-term (Phase 2)**
- ✅ Implement comprehensive testing (Jest, Vitest, Playwright)
- ✅ Create complete technical documentation
- ✅ Set up CI/CD pipelines with GitHub Actions
- ⏳ Add code quality tools and pre-commit hooks
- ⏳ Implement monitoring and logging

**Long-term**
- Production-ready deployment configuration
- Kubernetes orchestration
- Advanced monitoring and alerting
- API rate limiting and authentication
- Microservices expansion

---

**Last Updated**: October 3, 2025  
**Maintained By**: RootKit-Original  
**AI Assistant**: Gemini CLI via GitHub Actions

*This file provides context for the Gemini AI assistant. Keep it updated as the project evolves.*
