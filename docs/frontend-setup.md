# Frontend Development Setup

React + Vite frontend application for the xRat Ecosystem.

## 🚀 Tech Stack

- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **Language:** JavaScript (ES6+)
- **Testing:** Vitest + React Testing Library

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css         # Application styles
│   ├── main.jsx        # Application entry point
│   ├── index.css       # Global styles
│   └── test/
│       └── setup.js    # Test setup configuration
├── __tests__/
│   ├── unit/           # Component unit tests
│   ├── integration/    # Integration tests
│   └── mocks/         # API mocks and fixtures
├── public/            # Static assets
├── index.html         # HTML template
├── Dockerfile         # Container configuration
├── package.json       # Dependencies and scripts
└── vitest.config.js   # Test configuration
```

## 🔧 Environment Variables

Create `.env` file in project root:

```bash
VITE_API_URL=http://localhost:3000
VITE_MOCK_WEBSOCKET=false
```

**Note:** Vite requires environment variables to be prefixed with `VITE_`

## 🏃 Getting Started

### With Docker (Recommended)

```bash
# Use o script xrat.sh - NÃO use docker-compose diretamente
./xrat.sh start

# View frontend logs
./xrat.sh logs frontend

# Access frontend shell
./xrat.sh shell-frontend
```

> ⚠️ **IMPORTANTE**: Sempre use `./xrat.sh` para gerenciar containers. O script garante configuração e logs corretos.

### Without Docker

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Application Features

### System Status Dashboard

Real-time monitoring of:

- MongoDB connection status
- Redis connection status
- Backend API connectivity
- Frontend running status

### Redis Cache Testing

Interactive form to:

- Store key-value pairs in Redis
- Test cache functionality
- Receive success/error feedback

### Ecosystem Information

Displays:

- Exposed ports (Frontend: 5173, Backend: 3000)
- Internal services (MongoDB, Redis)
- Network isolation details

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Types

- **Unit Tests:** Individual component testing
- **Integration Tests:** Component interaction testing
- **E2E Tests:** Complete user flow testing (future with Playwright)

See [Testing Documentation](./TESTING.md) for comprehensive testing guide.

## 🎨 Styling

### CSS Structure

```
src/
├── index.css     # Global styles, resets, variables
└── App.css       # Component-specific styles
```

### Style Guidelines

- Use CSS custom properties for theming
- Follow BEM naming convention (optional)
- Keep styles modular and component-scoped
- Use semantic class names

### CSS Custom Properties

```css
:root {
  --primary-color: #646cff;
  --background-color: #242424;
  --text-color: rgba(255, 255, 255, 0.87);
}

.component {
  color: var(--text-color);
  background: var(--background-color);
}
```

## 📦 Dependencies

### Production

- `react` - UI library
- `react-dom` - DOM rendering

### Development

- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React plugin for Vite
- `vitest` - Test framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for testing

## 🛠️ Scripts

```bash
npm run dev            # Start development server with HMR
npm run build          # Build for production
npm run preview        # Preview production build
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

## 🔥 Hot Module Replacement (HMR)

Vite provides instant HMR for fast development:

- Changes reflect immediately
- State is preserved during updates
- No full page reload needed

## 🏗️ Building for Production

```bash
# Build optimized bundle
npm run build

# Output: dist/ directory
# - Minified JavaScript
# - Optimized CSS
# - Compressed assets
```

### Build Optimizations

- Code splitting
- Tree shaking
- Asset optimization
- Compression
- Cache busting

## 🐛 Debugging

### Browser DevTools

1. Open Chrome/Firefox DevTools
2. Use React DevTools extension
3. Check Console for errors
4. Use Network tab for API calls

### Debugging Tests

```javascript
// Add debugger statement
it('should work', () => {
  debugger;
  expect(true).toBe(true);
});

// Or use verbose logging
it('should work', () => {
  console.log('State:', state);
  console.log('Props:', props);
});
```

## 📡 API Integration

### Fetch Configuration

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Example API call
const response = await fetch(`${API_URL}/api/status`);
const data = await response.json();
```

### Error Handling

```javascript
try {
  const response = await fetch(`${API_URL}/api/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  const data = await response.json();

  if (data.success) {
    // Handle success
  } else {
    // Handle API error
  }
} catch (error) {
  // Handle network error
  console.error('Network error:', error);
}
```

## 🎯 Component Best Practices

### Component Structure

```jsx
import { useState, useEffect } from 'react';
import './Component.css';

function Component({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return <div className="component">{/* JSX */}</div>;
}

export default Component;
```

### State Management

- Use `useState` for local state
- Use `useEffect` for side effects
- Use `useCallback` for memoized functions
- Use `useMemo` for expensive computations
- Consider Context API for global state (future)

### Performance Optimization

```jsx
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Lazy load components
const LazyComponent = lazy(() => import('./Component'));
```

## 🚀 Deployment

See [Deployment Documentation](./DEPLOYMENT.md) for production deployment.

### Quick Deploy

```bash
# Rebuild frontend service
./xrat.sh rebuild

# Or build static files
npm run build
# Deploy dist/ folder to web server
```

## 🔐 Security

### Best Practices

- Sanitize user input
- Validate data from API
- Use HTTPS in production
- Implement Content Security Policy
- Keep dependencies updated

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📝 Adding New Components

1. **Create component file:**

   ```jsx
   // src/components/NewComponent.jsx
   import { useState } from 'react';
   import './NewComponent.css';

   function NewComponent({ prop }) {
     return <div>{prop}</div>;
   }

   export default NewComponent;
   ```

2. **Create tests:**

   ```jsx
   // __tests__/unit/NewComponent.test.jsx
   import { render, screen } from '@testing-library/react';
   import NewComponent from '../../src/components/NewComponent';

   describe('NewComponent', () => {
     it('renders correctly', () => {
       render(<NewComponent prop="test" />);
       expect(screen.getByText('test')).toBeDefined();
     });
   });
   ```

3. **Import and use:**

   ```jsx
   import NewComponent from './components/NewComponent';

   function App() {
     return <NewComponent prop="value" />;
   }
   ```

## 🤝 Contributing

See [Contributing Guidelines](./CONTRIBUTING.md) for:

- Code style guidelines
- Component patterns
- Testing requirements
- Pull request process

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)

---

**Need help?** Check the [main README](../README.md) or open an issue on GitHub.
