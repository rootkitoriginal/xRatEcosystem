# Testing Guide - xRat Ecosystem

## 🎯 Testing Philosophy

The xRat Ecosystem follows the **testing pyramid** approach:

```
         /\
        /  \  E2E Tests (10%)
       /____\
      /      \
     / Integration \ (20%)
    /    Tests     \
   /______________  \
  /                  \
 /   Unit Tests (70%) \
/______________________\
```

### Testing Principles

1. **Fast Feedback**: Tests should run quickly
2. **Reliable**: Tests should be deterministic and reproducible
3. **Maintainable**: Tests should be easy to update
4. **Comprehensive**: Cover critical paths and edge cases
5. **Isolated**: Tests should not depend on each other

### Coverage Requirements

- **Minimum**: 80% code coverage
- **Focus Areas**: Business logic, API endpoints, critical paths
- **Exclusions**: Configuration files, mocks, test utilities

---

## 🧪 Testing Stack

### Backend Testing

**Framework:** Jest  
**Additional Tools:**

- Supertest - HTTP assertions
- @types/jest - TypeScript support

**Configuration:** `backend/jest.config.js`

### Frontend Testing

**Framework:** Vitest  
**Additional Tools:**

- @testing-library/react - Component testing
- @testing-library/jest-dom - DOM matchers
- @testing-library/user-event - User interaction simulation
- jsdom - DOM environment

**Configuration:** `frontend/vitest.config.js`

### E2E Testing

**Framework:** Playwright  
**Browser:** Chrome/Chromium only  
**Additional Tools:**

- Docker Compose - Isolated test environment
- Custom fixtures and helpers

**Configuration:** `playwright.config.js`  
**Documentation:** [E2E Testing Guide](../__tests__/e2e/README.md)

---

## 🚀 Running Tests

### Backend Tests

```bash
# Run all tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- api.test.js

# Run tests in Docker
npm run test:docker
```

### Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- App.test.jsx

# Run tests in watch mode (default)
npm test
```

### E2E Tests

End-to-End tests validate the entire system integration.

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run with debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test suite
npx playwright test __tests__/e2e/auth/

# Keep containers for debugging
E2E_KEEP_CONTAINERS=true npm run test:e2e
```

**Quick Reference:** [E2E Quick Reference](./E2E_QUICK_REFERENCE.md)  
**Full Guide:** [E2E Testing Guide](../__tests__/e2e/README.md)  
**CI Integration:** [E2E CI Integration](./E2E_CI_INTEGRATION.md)

### Smoke Tests

Smoke tests verify critical scripts and tools work correctly without testing every detail.

```bash
# Run smoke tests (from project root)
npm run test:smoke

# Run with verbose output
npm run test:smoke -- --verbose

# Run with coverage
npm run test:smoke -- --coverage
```

**What's included:**

- Monitor script (`bin/monitorDevOps.js`) functionality
- Basic execution and error handling
- Mocked API calls (no real GitHub requests)

See [`__tests__/smoke/README.md`](../__tests__/smoke/README.md) for details.

### Run All Tests

```bash
# From project root
./xrat.sh test  # (future script)

# Or manually
cd backend && npm test && cd ../frontend && npm test && cd .. && npm run test:smoke
```

---

## 📁 Test Structure

### Project Root

```
__tests__/
└── smoke/               # Smoke tests for critical scripts
    ├── monitor.test.js  # DevOps monitor smoke test
    └── README.md        # Smoke test documentation
jest.config.js           # Root-level Jest configuration
```

### Backend

```
backend/
├── __tests__/
│   ├── unit/              # Unit tests
│   │   └── utils.test.js
│   ├── integration/       # Integration tests
│   │   └── api.test.js
│   ├── e2e/              # End-to-end tests
│   │   └── workflow.test.js
│   └── fixtures/         # Test data
│       └── mockData.js
├── src/
│   └── index.js
└── jest.config.js
```

### Frontend

```
frontend/
├── __tests__/
│   ├── unit/             # Component tests
│   │   └── App.test.jsx
│   ├── integration/      # Integration tests
│   │   └── flow.test.jsx
│   └── mocks/           # API mocks
│       └── handlers.js
├── src/
│   ├── App.jsx
│   └── test/
│       └── setup.js
└── vitest.config.js
```

---

## ✍️ Writing Tests

### Backend Unit Tests

**File naming:** `*.test.js`

**Example:**

```javascript
// __tests__/unit/utils.test.js
describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-03');
      const formatted = formatDate(date);
      expect(formatted).toBe('2025-01-03');
    });

    it('should handle invalid dates', () => {
      expect(() => formatDate('invalid')).toThrow();
    });
  });
});
```

### Backend Integration Tests

**File naming:** `*.test.js`

**Example:**

```javascript
// __tests__/integration/api.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('API Endpoints', () => {
  describe('POST /api/data', () => {
    it('should store data successfully', async () => {
      const response = await request(app).post('/api/data').send({ key: 'test', value: 'data' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/api/data').send({});

      expect(response.status).toBe(400);
    });
  });
});
```

### Frontend Component Tests

**File naming:** `*.test.jsx`

**Example:**

```javascript
// __tests__/unit/Button.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../src/components/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Frontend Integration Tests

**Example:**

```javascript
// __tests__/integration/UserFlow.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

describe('User Flow', () => {
  it('completes full data submission flow', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ database: { mongodb: 'connected' } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

    const user = userEvent.setup();
    render(<App />);

    // Fill form
    await user.type(screen.getByLabelText('Key:'), 'test-key');
    await user.type(screen.getByLabelText('Value:'), 'test-value');

    // Submit
    await user.click(screen.getByText('💾 Save to Cache'));

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeDefined();
    });
  });
});
```

---

## 🔐 Security Testing

### JWT Authentication Security Tests

The xRat Ecosystem implements comprehensive security testing for JWT authentication to prevent vulnerabilities and edge cases.

**Test Coverage: 98 security tests**

#### JWT Utility Tests (43 tests)

Location: `backend/__tests__/unit/utils/jwt.test.js`

**What's tested:**

- Token generation and verification
- Malformed token detection (missing parts, invalid structure)
- Signature manipulation and tampering
- Algorithm specification attacks ("alg: none" bypass)
- Header and payload corruption
- Expiration and timing scenarios
- Type confusion attacks

**Example:**

```javascript
describe('JWT Security - Algorithm Manipulation', () => {
  it('should reject token with "alg: none" attack', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(testPayload)).toString('base64url');
    const noneToken = `${header}.${payload}.`;

    expect(() => {
      verifyAccessToken(noneToken);
    }).toThrow();
  });

  it('should reject token with modified payload', () => {
    const token = generateAccessToken(testPayload);
    const parts = token.split('.');
    const modifiedPayload = Buffer.from(
      JSON.stringify({ userId: 'hacked', role: 'admin' })
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

    expect(() => {
      verifyAccessToken(tamperedToken);
    }).toThrow();
  });
});
```

#### Auth Middleware Security Tests (37 tests)

Location: `backend/__tests__/unit/security/jwt-edge-cases.test.js`

**What's tested:**

- Token format edge cases (whitespace, special characters)
- Database connection failures during validation
- Concurrent authentication attempts
- Error message security (dev vs production)
- Request object pollution prevention
- Authorization header type validation

**Example:**

```javascript
describe('Error Message Security', () => {
  it('should not expose sensitive details in production', async () => {
    process.env.NODE_ENV = 'production';
    req.headers.authorization = 'Bearer invalid_token';

    const error = new Error('Sensitive information');
    verifyAccessToken.mockImplementation(() => {
      throw error;
    });

    await authenticate(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error).toBeUndefined(); // No details leaked
    expect(jsonCall.message).toBe('Authentication error');

    delete process.env.NODE_ENV;
  });
});
```

#### Rate Limiting Security Tests (18 tests)

Location: `backend/__tests__/unit/security/rate-limit-auth.test.js`

**What's tested:**

- Brute force prevention
- IP-based rate limiting
- Distributed attack patterns
- Account lockout mechanisms
- Timing attack prevention
- Security header validation

**Example:**

```javascript
describe('Authentication Rate Limiting', () => {
  it('should block authentication after exceeding rate limit', async () => {
    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send({ username: 'test', password: 'wrong' });
    }

    // 6th attempt should be rate limited
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'test', password: 'wrong' });

    expect(response.status).toBe(429);
    expect(response.body.message).toBe('Too many authentication attempts. Please try again later.');
  });
});
```

### Running Security Tests

```bash
# Run all JWT security tests
cd backend
npm test -- __tests__/unit/utils/jwt.test.js
npm test -- __tests__/unit/security/

# Run with coverage
npm test -- --coverage __tests__/unit/security/

# Run specific security test suite
npm test -- __tests__/unit/security/jwt-edge-cases.test.js
npm test -- __tests__/unit/security/rate-limit-auth.test.js
```

### Security Vulnerabilities Prevented

- ✅ **Algorithm manipulation**: "alg: none" and algorithm confusion attacks
- ✅ **Token tampering**: Signature validation catches modifications
- ✅ **Brute force**: Rate limiting (5 attempts per 15 minutes)
- ✅ **Information disclosure**: Generic error messages in production
- ✅ **Request pollution**: Token data isolation
- ✅ **Database failures**: Graceful error handling
- ✅ **Type confusion**: Safe handling of non-string headers
- ✅ **Timing attacks**: Rate limiting applied before auth processing

---

## 🎭 Mocking

### Mocking Modules (Backend)

```javascript
// Mock external dependencies
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  connection: { readyState: 1 },
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
  })),
}));
```

### Mocking API Calls (Frontend)

```javascript
// Mock fetch globally
beforeEach(() => {
  global.fetch = vi.fn();
});

// Mock specific response
global.fetch.mockResolvedValueOnce({
  json: async () => ({ success: true }),
});

// Mock error
global.fetch.mockRejectedValueOnce(new Error('Network error'));
```

### Using MSW (Mock Service Worker) - Future

```javascript
// mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/status', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ database: { mongodb: 'connected' } }));
  }),
];
```

---

## 📊 Code Coverage

### Viewing Coverage Reports

```bash
# Backend
cd backend
npm run test:coverage
open coverage/index.html

# Frontend
cd frontend
npm run test:coverage
open coverage/index.html
```

### Coverage Thresholds

Both backend and frontend are configured with 80% minimum coverage:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Excluding Files from Coverage

**Backend** (`jest.config.js`):

```javascript
collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!**/node_modules/**'];
```

**Frontend** (`vitest.config.js`):

```javascript
coverage: {
  exclude: ['node_modules/', 'src/test/', '**/*.test.{js,jsx}', '**/*.config.js'];
}
```

---

## 🐛 Debugging Tests

### Backend (Jest)

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Use debugger statement in tests
it('should debug this', () => {
  debugger; // Breakpoint here
  expect(true).toBe(true);
});
```

### Frontend (Vitest)

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Debug in VS Code
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Debugging Tips

1. **Isolate the test**: Use `.only` to run a single test

   ```javascript
   it.only('should test this', () => {
     // This is the only test that will run
   });
   ```

2. **Skip flaky tests temporarily**: Use `.skip`

   ```javascript
   it.skip('flaky test', () => {
     // This test will be skipped
   });
   ```

3. **Add verbose logging**

   ```javascript
   it('should debug', () => {
     console.log('State:', state);
     console.log('Response:', response);
   });
   ```

4. **Check async issues**: Ensure promises are awaited
   ```javascript
   it('should handle async', async () => {
     await asyncFunction(); // Don't forget await!
     expect(result).toBe(expected);
   });
   ```

---

## 🎯 Best Practices

### 1. Test Naming

**Good:**

```javascript
it('should return 400 when key is missing');
it('should store data successfully');
it('should display error message on API failure');
```

**Bad:**

```javascript
it('test 1');
it('works');
it('should work correctly');
```

### 2. Arrange-Act-Assert Pattern

```javascript
it('should calculate total', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### 3. One Assertion Per Test (when possible)

```javascript
// Good
it('should return 200 status', () => {
  expect(response.status).toBe(200);
});

it('should return success true', () => {
  expect(response.body.success).toBe(true);
});

// Acceptable for related assertions
it('should return valid user object', () => {
  expect(response.body).toHaveProperty('id');
  expect(response.body).toHaveProperty('email');
  expect(response.body.email).toMatch(/@/);
});
```

### 4. Clean Up After Tests

```javascript
afterEach(() => {
  // Clean up
  vi.restoreAllMocks();
  cleanup();
});

afterAll(async () => {
  // Close connections
  await mongoose.connection.close();
  await redisClient.quit();
});
```

### 5. Use Test Fixtures

```javascript
// fixtures/users.js
export const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
};

// In tests
import { mockUser } from '../fixtures/users';

it('should create user', () => {
  const user = createUser(mockUser);
  expect(user.name).toBe(mockUser.name);
});
```

---

## 🔄 Continuous Integration

Tests are automatically run on:

- Pull requests
- Push to main/develop branches
- Scheduled runs (nightly)

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run backend tests
        run: cd backend && npm test
      - name: Run frontend tests
        run: cd frontend && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Last Updated:** 2025-01-03  
**Version:** 1.0.0
