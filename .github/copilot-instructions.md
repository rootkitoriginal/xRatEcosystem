# xRat Ecosystem Project Setup

## Project Overview

Docker-based isolated ecosystem with Node.js backend, React frontend, MongoDB, and Redis.

## Current Branch

🌿 **main** - All Phase 2 infrastructure complete, ready for Phase 3 parallel development

## 🚀 ACTIVE DEVELOPMENT - Parallel WebSocket & Testing Development

**Status**: 🟡 **3 PRs IN PROGRESS** - Copilot-managed parallel development

### Current Active PRs (Copilot Coding Agent):

#### PR #38 - WebSocket Real-time Communication 🔧 [WIP]

- **Branch**: `copilot/fix-e538b55c-0fd7-4d72-b3da-563805acd31c`
- **Status**: 🟡 DRAFT - Implementation nearly complete
- **Created**: 2025-10-04
- **Scope**: Complete WebSocket implementation with Socket.IO + JWT auth + room messaging
- **Progress**: Backend implementation done, 220 tests passing, health monitoring pending

#### PR #39 - Backend Test Coverage to 80%+ 🧪

- **Branch**: `copilot/fix-3d158b77-cfe2-4e1a-a608-3862fbc976ed`
- **Status**: 🟡 DRAFT - Coverage achieved (95.31% statements, 84.42% branches)
- **Created**: 2025-10-04
- **Scope**: Comprehensive unit tests for controllers, services, models, middleware
- **Progress**: 268 tests total, all coverage thresholds exceeded

#### PR #40 - Monitor Smoke Test + CI Job 🔍

- **Branch**: `copilot/fix-f0592d0f-6d43-4e05-b9a9-f563c537e320`
- **Status**: 🟡 DRAFT - Full implementation complete
- **Created**: 2025-10-04
- **Scope**: Smoke test for bin/monitorDevOps.js with CI integration
- **Progress**: 11 tests implemented, CI job configured, documentation complete

### Major Completed Features (Recently Closed):

#### ✅ JWT Authentication System (Issue #16 → PR #22)

- **Status**: ✅ MERGED 2025-10-04
- **Scope**: Complete JWT authentication with user management, password hashing, rate limiting
- **Implementation**: 17 auth tests, 5 endpoints, security middleware, comprehensive documentation

#### ✅ Health Check Endpoints (Issue #14)

- **Status**: ✅ CLOSED 2025-10-04
- **Scope**: `/health`, `/health/ready`, `/health/live` with MongoDB/Redis connectivity checks
- **Implementation**: Production-ready health monitoring system

#### ✅ Data Management API (Issue #18)

- **Status**: ✅ CLOSED 2025-10-04
- **Scope**: Advanced CRUD operations, validation, caching, search, filtering
- **Implementation**: Complete data management backend with Redis caching

#### ✅ Authentication UI Components (Issue #17)

- **Status**: ✅ CLOSED 2025-10-04
- **Scope**: Login/Register forms, AuthContext, protected routes, token management
- **Implementation**: Complete React authentication UI with mock development support

## Initial Setup Progress

- [x] Create copilot-instructions.md file
- [x] Get project setup information
- [x] Create Docker Compose configuration
- [x] Create backend Node.js service
- [x] Create frontend service
- [x] Create environment files
- [x] Create README documentation
- [x] Test and validate setup
- [x] Create GitHub repository
- [x] Push initial code to GitHub

## ✅ Initial Setup Complete!

All services are running successfully:

- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- MongoDB: Connected (internal only)
- Redis: Connected (internal only)
- GitHub: https://github.com/rootkitoriginal/xRatEcosystem

---

## 🚀 Phase 2: Testing, Documentation & CI/CD

### ✅ Completed Tasks

#### Gemini CLI Integration

- [x] Install and configure Gemini CLI workflows
  - [x] gemini-dispatch.yml - Central command dispatcher
  - [x] gemini-invoke.yml - General AI assistant
  - [x] gemini-review.yml - Automated PR reviews
  - [x] gemini-triage.yml - Issue triage
  - [x] gemini-scheduled-triage.yml - Scheduled triage
- [x] Configure GEMINI_API_KEY as GitHub Secret
- [x] Create GEMINI.md context file for AI assistant
- [x] Add .gemini/ to .gitignore

#### Local Testing with act

- [x] Install and configure act (GitHub Actions runner)
- [x] Create .actrc configuration file
- [x] Create .secrets file for local testing
- [x] Add comprehensive ACT_TESTING.md documentation
- [x] Test workflow detection and dry runs

#### Documentation Infrastructure

- [x] Create docs/ directory structure
- [x] Create docs/README.md with documentation index
- [x] Create docs/ACT_TESTING.md - Local testing guide
- [x] Update .gitignore with testing artifacts

### ✅ Phase 2 Complete!

All tasks from Phase 2 have been successfully completed:

#### Testing Infrastructure

- [x] Backend Testing (Node.js + Express)
  - [x] Install and configure Jest
  - [x] Add jest, supertest, @types/jest
  - [x] Create jest.config.js
  - [x] Add test scripts to package.json
  - [x] Create test structure (unit, integration, e2e, fixtures)
  - [x] Implement integration tests (8 passing tests)
  - [x] Add test coverage reporting (80% threshold)

- [x] Frontend Testing (React + Vite)
  - [x] Install and configure Vitest
  - [x] Add vitest, @testing-library/react, @testing-library/jest-dom
  - [x] Add @testing-library/user-event, jsdom
  - [x] Create vitest.config.js
  - [x] Add test scripts to package.json
  - [x] Create test structure (unit, integration, mocks)
  - [x] Implement component tests (8 passing tests)
  - [x] Add test coverage reporting (80% threshold)

#### Documentation

- [x] Technical Documentation
  - [x] ARCHITECTURE.md - System design and architecture with diagrams
  - [x] API.md - Complete API endpoints documentation
  - [x] TESTING.md - Comprehensive testing guide
  - [x] CONTRIBUTING.md - Contribution guidelines
  - [x] DEPLOYMENT.md - Deployment guide
  - [x] SECURITY.md - Security policies and best practices

- [x] Directory READMEs
  - [x] backend/README.md
  - [x] frontend/README.md
  - [x] docs/README.md (already exists)

#### CI/CD Workflows (GitHub Actions)

- [x] Core Workflows
  - [x] test.yml - Automated testing (backend, frontend, integration, security)
  - [x] build.yml - Docker image builds and GHCR publishing
  - [x] codeql.yml - Security scanning and dependency checks
  - [x] pr-checks.yml - PR validation and quality checks

- [x] Auto-labeling
  - [x] labeler.yml - Automatic PR labeling based on files

#### Quality Assurance

- [x] Code Quality Tools
  - [x] ESLint configuration (backend and frontend)
  - [x] Prettier configuration (.prettierrc, .prettierignore)
  - [x] EditorConfig (.editorconfig)
  - [x] Lint and format scripts added to package.json

#### Repository Configuration

- [x] GitHub Templates
  - [x] Bug report template
  - [x] Feature request template
  - [x] Question template
  - [x] PR template with comprehensive checklist

- [x] README Enhancements
  - [x] Add badges (Tests, Build, CodeQL, License, Node, Docker, PRs)
  - [x] Add contributors section
  - [x] Add documentation links
  - [x] Add project status and roadmap
  - [x] Add support section

- [x] Final Documentation
  - [x] CHANGELOG.md - Following Keep a Changelog format
  - [x] LICENSE - MIT License
  - [x] Update .gitignore with coverage and test artifacts

### 📊 Current Project Status (Updated October 4, 2025)

**✅ COMPLETED FEATURES:**

- ✅ **Phase 2 Complete**: 16 → 268 tests, 8 documentation files, 8 GitHub workflows, professional CI/CD
- ✅ **JWT Authentication System**: Complete with 17 tests, 5 endpoints, rate limiting (PR #22 merged)
- ✅ **Health Check Endpoints**: Production-ready `/health`, `/health/ready`, `/health/live` (Issue #14 closed)
- ✅ **Data Management API**: Advanced CRUD, caching, validation, search/filtering (Issue #18 closed)
- ✅ **Authentication UI**: Complete React auth components with context management (Issue #17 closed)
- ✅ **Structured Logging**: Winston implementation with rotation and levels (Issue #13 closed)
- ✅ **API Documentation**: 833-line OpenAPI spec with Swagger UI (Issue #11 closed)
- ✅ **Testing Infrastructure**: Jest (backend) + Vitest (frontend) with 80%+ coverage

**🟡 IN PROGRESS (Copilot Agent):**

- 🟡 **WebSocket Real-time**: Socket.IO + JWT + rooms, 220 tests passing (PR #38)
- 🟡 **Test Coverage**: 95.31% statements, 84.42% branches achieved (PR #39)
- 🟡 **Monitor Testing**: Smoke tests + CI integration complete (PR #40)

**📈 RECENT MILESTONES:**

- **Phase 3 Features**: Health checks, logging, advanced data management ✅ COMPLETE
- **Phase 4 Authentication**: JWT backend + React UI ✅ COMPLETE
- **Phase 5 Real-time**: WebSocket implementation 🟡 IN PROGRESS

**🚀 NEXT PHASES:**

- ⏳ **Phase 6**: Real-time UI components to pair with WebSocket backend
- ⏳ **Phase 7**: Advanced monitoring (Prometheus metrics, distributed tracing)
- ⏳ **Phase 8**: Production deployment infrastructure (Kubernetes, CI/CD automation)

---

## 🔥 CURRENT DEVELOPMENT STATUS

### Active Development - Copilot Coding Agent Integration

**Real-time Development Tracking:** All active development is now managed by GitHub Copilot coding agent through automated PR creation and management.

#### Open Issues (Active Development Pipeline):

##### Issue #35 - Release Preparation (v1.1.0) �️

- **Status**: 🟡 OPEN - Release management
- **Priority**: HIGH - Consolidate recent major merges
- **Scope**: Prepare release v1.1.0 with consolidated changelog, CI validation, tag creation
- **Blockers**: None - ready for release preparation

##### Issue #34 - Monitor Smoke Test + CI Job 🔍 → PR #40

- **Status**: 🟡 OPEN → ✅ IMPLEMENTED (PR #40 ready for review)
- **Branch**: `copilot/fix-f0592d0f-6d43-4e05-b9a9-f563c537e320`
- **Scope**: Smoke testing for `bin/monitorDevOps.js` with CI integration
- **Progress**: 11 comprehensive tests, CI job configured, full documentation

##### Issue #31 - Backend Test Coverage to 80%+ 🧪 → PR #39

- **Status**: 🟡 OPEN → ✅ EXCEEDED (95.31% statements, 84.42% branches)
- **Branch**: `copilot/fix-3d158b77-cfe2-4e1a-a608-3862fbc976ed`
- **Scope**: Comprehensive unit tests to meet coverage thresholds
- **Progress**: 268 tests total, all thresholds significantly exceeded

##### Issue #21 - Real-time UI Components ⚛️

- **Status**: 🟡 OPEN - Frontend WebSocket integration
- **Priority**: MEDIUM - Depends on WebSocket backend (PR #38)
- **Scope**: React components for Socket.IO client, notifications, real-time updates
- **Blockers**: Waiting for WebSocket backend completion

##### Issue #20 - WebSocket Real-time Communication 🔧 → PR #38

- **Status**: 🟡 OPEN → ✅ NEARLY COMPLETE (220 tests passing)
- **Branch**: `copilot/fix-e538b55c-0fd7-4d72-b3da-563805acd31c`
- **Scope**: Complete WebSocket implementation with Socket.IO, JWT auth, room messaging
- **Progress**: Backend implementation complete, comprehensive testing, health monitoring pending

### Recent Major Completions (2025-10-04):

#### ✅ JWT Authentication System (Issue #16 → PR #22 MERGED)

- **Implementation**: Complete JWT auth with user management, password hashing, rate limiting
- **Features**: 5 endpoints, 17 auth tests, security middleware, comprehensive documentation
- **Impact**: Enables secure API access, user management, protected routes

#### ✅ Authentication UI Components (Issue #17 CLOSED)

- **Implementation**: Complete React authentication UI with AuthContext, protected routes
- **Features**: Login/Register forms, token management, mock development support
- **Impact**: Full-stack authentication system ready for production

#### ✅ Data Management API (Issue #18 CLOSED)

- **Implementation**: Advanced CRUD operations, validation, caching, search, filtering
- **Features**: Redis caching, MongoDB integration, comprehensive API endpoints
- **Impact**: Robust data management backend supporting complex operations

#### ✅ Health Check Endpoints (Issue #14 CLOSED)

- **Implementation**: Production-ready health monitoring system
- **Features**: `/health`, `/health/ready`, `/health/live` with service connectivity checks
- **Impact**: Container orchestration ready, monitoring integration enabled

**🤖 DevOps Automation Strategy:**

- Use `.github/scripts/dev-automation.sh` for comprehensive CI/CD management
- Coordinate parallel PR development with `.github/scripts/pr-manager.sh`
- Monitor and invoke Copilot through `.github/scripts/copilot-workflow.sh`
- Leverage DevOPS.chatmode.md for specialized infrastructure assistance
  **🎯 How to Work with DevOPS ChatMode:**

1. **Activate DevOPS Mode**: Use `.github/chatmodes/DevOPS.chatmode.md` for infrastructure tasks
2. **Script-First Approach**: DevOPS mode will recommend appropriate automation scripts
3. **GitHub CLI Integration**: All DevOPS responses include relevant gh aliases and commands
4. **Copilot Coordination**: DevOPS mode manages Copilot invocation in PRs automatically
5. **Parallel Development**: DevOPS mode provides conflict analysis and merge strategies

**DevOPS Mode Use Cases:**

- CI/CD pipeline troubleshooting and optimization
- PR management and merge conflict resolution
- Copilot coordination across multiple parallel PRs
- Infrastructure monitoring and health check implementation
- Automated deployment strategies and rollback procedures

**Example DevOPS Workflow:**

```bash
# Use DevOPS chatmode for infrastructure questions
# It will recommend: ./.github/scripts/dev-automation.sh
# Then guide through: Copilot invocation, CI monitoring, merge strategy
```

#### Docker Testing

- [ ] Create test docker-compose.yml
  - [ ] Isolated test database
  - [ ] Isolated test Redis
  - [ ] Test environment configuration
- [ ] Add scripts for running tests in containers
  - [ ] `npm run test:docker:backend`
  - [ ] `npm run test:docker:frontend`

### Documentation

#### Technical Documentation ✅ COMPLETED

- [x] Create `docs/` directory structure ✅
- [x] Create ARCHITECTURE.md ✅
  - [x] System overview diagram
  - [x] Component architecture
  - [x] Data flow diagrams
  - [x] Technology stack details
  - [x] Docker networking explanation
- [x] Create API.md ✅
  - [x] API endpoints documentation
  - [x] Request/Response examples
  - [x] Authentication details
  - [x] Error codes and handling
  - [x] Rate limiting information
- [x] Create TESTING.md ✅
  - [x] Testing philosophy
  - [x] Running tests locally
  - [x] Writing new tests
  - [x] Test coverage requirements
  - [x] Debugging tests
- [x] Create CONTRIBUTING.md ✅
  - [x] Code of conduct
  - [x] Development workflow
  - [x] Branch naming conventions
  - [x] Commit message guidelines
  - [x] Pull request process
  - [x] Code review guidelines
- [x] Create DEPLOYMENT.md ✅
  - [x] Local deployment
  - [x] Production deployment
  - [x] Environment variables
  - [x] Troubleshooting
  - [x] Monitoring and logs
- [x] Create SECURITY.md ✅
  - [x] Security policies
  - [x] Reporting vulnerabilities
  - [x] Security best practices
  - [x] Dependencies management

#### API Documentation ✅ COMPLETED

- [x] Add Swagger/OpenAPI ✅
  - [x] Install swagger-ui-express ✅
  - [x] Create openapi.yaml ✅ (833 lines)
  - [x] Add Swagger UI endpoint ✅
  - [x] Document all API endpoints ✅
- [ ] Add JSDoc comments
  - [ ] Document all functions
  - [ ] Document all classes
  - [ ] Document all modules

#### Code Documentation ✅ MOSTLY COMPLETED

- [ ] Add inline comments for complex logic
- [x] Create README.md for each major directory ✅
  - [x] backend/README.md ✅
  - [x] frontend/README.md ✅
  - [x] docs/README.md ✅

### CI/CD Workflows (GitHub Actions) ✅ COMPLETED

#### Core Workflows ✅ COMPLETED

- [x] Create `.github/workflows/` directory ✅
- [x] Create `test.yml` - Testing workflow ✅
  - [x] Run on: push, pull_request ✅
  - [x] Lint backend code ✅
  - [x] Lint frontend code ✅
  - [x] Run backend unit tests ✅
  - [x] Run frontend unit tests ✅
  - [x] Run integration tests ✅
  - [x] Generate coverage reports ✅
  - [ ] Upload coverage to Codecov
- [x] Create `build.yml` - Build workflow ✅
  - [x] Build backend Docker image ✅
  - [x] Build frontend Docker image ✅
  - [x] Test Docker Compose setup ✅
  - [ ] Push images to GitHub Container Registry (GHCR)
- [ ] Create `deploy.yml` - Deployment workflow
  - [ ] Deploy to staging on merge to develop
  - [ ] Deploy to production on release tags
  - [ ] Run health checks post-deployment
- [ ] Create `codeql.yml` - Security scanning
  - [ ] CodeQL analysis
  - [ ] Dependency scanning
  - [ ] Secret scanning
- [ ] Create `release.yml` - Release automation
  - [ ] Create release notes
  - [ ] Build and tag Docker images
  - [ ] Create GitHub release
  - [ ] Update changelog

#### Additional Workflows ✅ MOSTLY COMPLETED

- [x] Create `pr-checks.yml` - PR validation ✅
  - [x] Check PR title format ✅
  - [x] Check branch naming ✅
  - [x] Verify tests pass ✅
  - [x] Check code coverage ✅
- [ ] Create `docs.yml` - Documentation
  - [ ] Build documentation
  - [ ] Deploy to GitHub Pages
  - [ ] Check for broken links
- [ ] Create `dependency-update.yml` - Dependencies
  - [ ] Automated dependency updates
  - [ ] Security vulnerability checks

#### Gemini AI Workflows ✅ COMPLETED

- [x] gemini-dispatch.yml - Central command dispatcher ✅
- [x] gemini-invoke.yml - General AI assistant ✅
- [x] gemini-review.yml - Automated PR reviews ✅
- [x] gemini-triage.yml - Issue triage ✅
- [x] gemini-scheduled-triage.yml - Scheduled triage ✅

### Quality Assurance ✅ COMPLETED

#### Code Quality Tools ✅ COMPLETED

- [x] ESLint configuration ✅
  - [x] Backend ESLint config ✅
  - [x] Frontend ESLint config ✅
  - [x] Shared ESLint rules ✅
- [x] Prettier configuration ✅
  - [x] .prettierrc ✅
  - [x] .prettierignore ✅
  - [x] Add format scripts ✅
- [ ] Husky + lint-staged
  - [ ] Pre-commit hooks
  - [ ] Pre-push hooks
  - [ ] Commit message validation
- [x] EditorConfig ✅
  - [x] .editorconfig for consistent coding style ✅

#### Monitoring & Logging ✅ MOSTLY COMPLETED

- [x] Add structured logging ✅
  - [x] Winston for backend ✅
  - [x] Log rotation ✅
  - [x] Log levels ✅
- [x] Add health check endpoints ✅
  - [x] `/health` - Basic health ✅
  - [x] `/health/ready` - Readiness check ✅
  - [x] `/health/live` - Liveness check ✅
- [ ] Add monitoring
  - [ ] Prometheus metrics endpoint
  - [ ] Custom metrics

### Repository Configuration ✅ COMPLETED

#### GitHub Repository Settings ✅ COMPLETED

- [x] Add branch protection rules ✅
  - [x] Require PR reviews ✅
  - [x] Require status checks ✅
  - [x] Require up-to-date branches ✅
- [x] Add issue templates ✅
  - [x] Bug report template ✅
  - [x] Feature request template ✅
  - [x] Question template ✅
- [x] Add PR template ✅
  - [x] PR description template ✅
  - [x] Checklist for PRs ✅
- [x] Add labels ✅
  - [x] bug, enhancement, documentation ✅
  - [x] good first issue, help wanted ✅
  - [x] priority labels ✅

#### README Enhancements ✅ COMPLETED

- [x] Add badges ✅
  - [x] CI/CD status ✅
  - [x] Code coverage ✅
  - [x] License ✅
  - [x] Version ✅
  - [x] Docker pulls ✅
  - [x] GitHub stars ✅
- [ ] Add quick start GIF/video
- [x] Add contributors section ✅
- [x] Add changelog link ✅

### Final Steps ✅ COMPLETED

- [x] Update .gitignore ✅
  - [x] Test coverage reports ✅
  - [x] Test artifacts ✅
  - [x] IDE files ✅
- [x] Create CHANGELOG.md ✅
  - [x] Follow Keep a Changelog format ✅
  - [x] Document all changes ✅
- [x] Create LICENSE file ✅
  - [x] Choose appropriate license (MIT) ✅
- [x] Final review and testing ✅
  - [x] Test all workflows locally ✅
  - [x] Verify documentation ✅
  - [x] Run full test suite ✅ (205 tests passing, 82.2% coverage)
- [x] Create pull request to main ✅
  - [x] Comprehensive PR description ✅
  - [x] Link related issues ✅
  - [x] Request reviews ✅

### 🆕 NEW REQUIREMENTS - Next Phase Development

#### Advanced Docker Testing Infrastructure

- [ ] Create `docker-compose.test.yml` for isolated testing
  - [ ] Test-specific MongoDB instance
  - [ ] Test-specific Redis instance
  - [ ] Test environment variables configuration
  - [ ] Network isolation for tests
- [ ] Add containerized testing scripts
  - [ ] `npm run test:docker:backend` - Run backend tests in container
  - [ ] `npm run test:docker:frontend` - Run frontend tests in container
  - [ ] `npm run test:docker:integration` - Full integration tests
  - [ ] `npm run test:docker:e2e` - End-to-end tests in containers

#### Production Deployment Infrastructure

- [ ] Create `deploy.yml` workflow
  - [ ] Staging deployment on merge to develop
  - [ ] Production deployment on release tags
  - [ ] Health checks post-deployment
  - [ ] Rollback capabilities
- [ ] Add security scanning
  - [ ] CodeQL analysis workflow
  - [ ] Dependency vulnerability scanning
  - [ ] Secret scanning automation
  - [ ] Container image scanning
- [ ] Release automation
  - [ ] Automated release notes generation
  - [ ] Docker image tagging and GHCR publishing
  - [ ] GitHub release creation
  - [ ] Changelog automation

#### Monitoring & Observability

- [ ] Add Prometheus metrics
  - [ ] `/metrics` endpoint implementation
  - [ ] Custom business metrics
  - [ ] Resource utilization metrics
  - [ ] Request/response metrics
- [ ] Add distributed tracing
  - [ ] OpenTelemetry integration
  - [ ] Request correlation IDs
  - [ ] Cross-service tracing
- [ ] Enhanced logging
  - [ ] Structured JSON logging
  - [ ] Centralized log aggregation
  - [ ] Log-based alerting

#### Development Experience Enhancements

- [ ] Pre-commit hooks with Husky
  - [ ] Automated code formatting
  - [ ] Lint checks before commit
  - [ ] Test validation
  - [ ] Commit message validation
- [ ] Documentation automation
  - [ ] GitHub Pages deployment
  - [ ] API documentation auto-generation
  - [ ] Link checking automation
  - [ ] Documentation versioning
- [ ] Dependency management
  - [ ] Automated dependency updates
  - [ ] Security vulnerability alerts
  - [ ] License compliance checking

#### Performance & Scalability

- [ ] Add caching strategies
  - [ ] Redis caching layers
  - [ ] Response caching middleware
  - [ ] Database query optimization
- [ ] Load testing infrastructure
  - [ ] Performance benchmarking
  - [ ] Stress testing automation
  - [ ] Performance regression detection
- [ ] Database optimization
  - [ ] Index optimization
  - [ ] Query performance monitoring
  - [ ] Connection pooling optimization

## 🤖 DevOps Automation Integration

### GitHub CLI + Script Integration Complete

**Automation Scripts**: `.github/scripts/`

- `dev-automation.sh` - Main DevOps interface with full CI/CD automation
- `copilot-workflow.sh` - Interactive Copilot management and invocation
- `pr-manager.sh` - Advanced PR conflict analysis for #38, #39, #40
- `copilot-helper.sh` - Individual utility commands and GitHub CLI aliases
- `demo-copilot.sh` - Quick status overview and usage examples

**GitHub CLI Aliases Configured**:

```bash
gh copilot-prs      # List PRs mentioning Copilot
gh copilot-issues   # List issues mentioning Copilot
gh pr-ready [NUM]   # Check CI status and merge readiness
gh quick-merge [NUM] # Squash merge with branch deletion
gh pr-conflicts [NUM] # Show file changes for conflict analysis
gh ci-logs          # View failed CI logs
gh copilot-assign   # Add Copilot mention to issue/PR
```

**DevOPS ChatMode Available**: `.github/chatmodes/DevOPS.chatmode.md`

- Specialized DevOps assistant with deep script integration
- Automated workflow patterns for daily operations
- PR management strategies with conflict resolution
- Copilot coordination workflows
- CI/CD troubleshooting with script-based solutions

### How to Use DevOps Integration

#### For Development Tasks:

```bash
# Interactive development dashboard
./.github/scripts/dev-automation.sh

# Copilot coordination for PRs
./.github/scripts/copilot-workflow.sh
```

#### For PR Management:

```bash
# Comprehensive PR analysis
./.github/scripts/pr-manager.sh

# Quick status and examples
./.github/scripts/demo-copilot.sh
```

#### For Copilot Invocation:

```bash
# WebSocket implementation (PR #38)
gh pr comment 38 --body "@copilot Implement WebSocket with socket.io + JWT auth"

# Test coverage (PR #39)
gh pr comment 39 --body "@copilot Increase backend test coverage to 80%"

# Monitor testing (PR #40)
gh pr comment 40 --body "@copilot Create smoke test for monitorDevOps.js"
```

## Project Structure

- Backend: Node.js + Express + MongoDB + Redis
- Frontend: React + Vite
- Database: MongoDB (internal only)
- Cache: Redis (internal only)
- Networking: Isolated Docker network
- Exposed Ports: Backend and Frontend only
- Testing: Jest (Backend) + Vitest + Playwright (Frontend)
- CI/CD: GitHub Actions + GitHub CLI automation
- Documentation: Comprehensive technical docs
- **DevOps**: Full automation with scripts + Copilot integration
