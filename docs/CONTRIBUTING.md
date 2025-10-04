# Contributing to xRat Ecosystem

Thank you for considering contributing to the xRat Ecosystem! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory remarks
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

---

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development without Docker)
- Git
- A GitHub account

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/xRatEcosystem.git
   cd xRatEcosystem
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/xLabInternet/xRatEcosystem.git
   ```

4. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

7. **Verify everything works:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000/health

---

## 💻 Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
# Update your local main
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

**Examples:**
```
feature/add-authentication
fix/redis-connection-timeout
docs/update-api-documentation
refactor/improve-error-handling
test/add-integration-tests
chore/update-dependencies
```

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage

# Manual testing
# Verify your changes work in the browser
```

### 4. Commit Your Changes

Follow the commit message guidelines (see below):

```bash
git add .
git commit -m "feat: add user authentication"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template
5. Submit the pull request

---

## 📝 Coding Standards

### JavaScript/JSX Style

#### General Rules

- Use **ES6+** features
- Use **const** by default, **let** when reassignment is needed
- Avoid **var**
- Use **arrow functions** for callbacks
- Use **template literals** for string interpolation
- Use **async/await** over Promise chains

#### Formatting

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Use them
- **Line length:** Max 100 characters
- **Trailing commas:** In multiline arrays/objects

**Example:**
```javascript
// Good
const getUserData = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

// Bad
var getUserData = function(userId) {
  return fetch("/api/users/" + userId).then(function(response) {
    return response.json()
  })
}
```

### File Organization

#### Backend

```
src/
├── controllers/    # Request handlers
├── models/        # Database models
├── routes/        # Express routes
├── middleware/    # Custom middleware
├── services/      # Business logic
├── utils/         # Utility functions
└── index.js       # Application entry
```

#### Frontend

```
src/
├── components/    # Reusable components
├── pages/        # Page components
├── hooks/        # Custom React hooks
├── utils/        # Utility functions
├── services/     # API services
├── styles/       # CSS/styles
└── App.jsx       # Main component
```

### Naming Conventions

- **Files:** camelCase for utilities, PascalCase for components
  - `userService.js`, `Button.jsx`
- **Variables:** camelCase
  - `const userName = 'John';`
- **Constants:** UPPER_SNAKE_CASE
  - `const MAX_RETRIES = 3;`
- **Components:** PascalCase
  - `function UserProfile() { ... }`
- **Functions:** camelCase
  - `function fetchUserData() { ... }`
- **Classes:** PascalCase
  - `class UserManager { ... }`

### Code Comments

- Write self-documenting code when possible
- Add comments for complex logic
- Use JSDoc for functions and classes

**Example:**
```javascript
/**
 * Calculates the total price including tax
 * @param {number} price - Base price
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns {number} Total price with tax
 */
function calculateTotal(price, taxRate) {
  return price * (1 + taxRate);
}
```

---

## 📨 Commit Guidelines

We follow the **Conventional Commits** specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no code change)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks
- **perf:** Performance improvements
- **ci:** CI/CD changes

### Examples

```bash
# Feature
feat(auth): add JWT authentication

# Bug fix
fix(api): handle null values in user response

# Documentation
docs: update API documentation with new endpoints

# Refactoring
refactor(backend): extract validation logic into middleware

# Tests
test(frontend): add unit tests for Button component

# Breaking change
feat(api)!: change response format for /api/users

BREAKING CHANGE: User response now returns array instead of object
```

### Rules

1. Use present tense ("add feature" not "added feature")
2. Use imperative mood ("move cursor to..." not "moves cursor to...")
3. First line max 72 characters
4. Separate subject from body with blank line
5. Wrap body at 72 characters
6. Explain what and why, not how

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commits follow commit guidelines
- [ ] Branch is up to date with main

### PR Title Format

Follow the same format as commit messages:

```
feat(auth): add user authentication
fix(api): resolve timeout issues
docs: update contribution guide
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new warnings generated
```

### Review Process

1. **Automated Checks:** CI/CD runs tests and linting
2. **Code Review:** At least one maintainer reviews the PR
3. **Changes Requested:** Address feedback and push updates
4. **Approval:** Once approved, the PR can be merged
5. **Merge:** Maintainer merges the PR

### After Merge

```bash
# Update your local repository
git checkout main
git pull upstream main

# Delete your feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## 🧪 Testing Requirements

### Coverage Requirements

- Minimum 80% code coverage
- All new features must include tests
- Bug fixes should include regression tests

### Test Types

1. **Unit Tests:** Test individual functions/components
2. **Integration Tests:** Test API endpoints and interactions
3. **E2E Tests:** Test complete user workflows

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# With coverage
npm run test:coverage
```

See [TESTING.md](./TESTING.md) for detailed testing guidelines.

---

## 📚 Documentation

### What to Document

- New features and APIs
- Configuration options
- Breaking changes
- Migration guides
- Architecture decisions

### Where to Document

- **Code:** JSDoc comments
- **README.md:** Project overview and quick start
- **docs/:** Detailed documentation
- **API.md:** API endpoints
- **ARCHITECTURE.md:** System design

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams when helpful
- Keep documentation up to date
- Use proper markdown formatting

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test on the latest version

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Docker version: [e.g., 24.0.0]
- Node version: [e.g., 20.0.0]
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

---

## ❓ Getting Help

- **GitHub Issues:** For bugs and feature requests
- **GitHub Discussions:** For questions and ideas
- **Documentation:** Check docs/ directory

---

## 🏆 Recognition

Contributors are listed in:
- GitHub contributors page
- CHANGELOG.md for significant contributions
- README.md contributors section

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to xRat Ecosystem!** 🎉

---

**Last Updated:** 2025-01-03  
**Version:** 1.0.0
