# xRat Ecosystem - Backend

Node.js + Express API server for the xRat Ecosystem.

## 🚀 Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js 4.18
- **Database:** MongoDB (via Mongoose)
- **Cache:** Redis
- **Security:** Helmet.js
- **Testing:** Jest + Supertest

## 📁 Project Structure

```
backend/
├── src/
│   └── index.js           # Main application entry point
├── __tests__/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests (API endpoints)
│   ├── e2e/             # End-to-end tests
│   └── fixtures/        # Test data and mocks
├── Dockerfile           # Container configuration
├── package.json         # Dependencies and scripts
└── jest.config.js       # Test configuration
```

## 🔧 Environment Variables

Create a `.env` file in the project root:

```bash
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://mongo:27017/xrat

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 🏃 Getting Started

### With Docker (Recommended)

```bash
# From project root
docker-compose up -d

# View backend logs
docker-compose logs -f backend

# Access backend shell
docker-compose exec backend sh
```

### Without Docker

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

**Note:** MongoDB and Redis must be running locally or accessible via network.

## 📡 API Endpoints

### Health & Status

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/status` - Detailed system status

### Data Management

- `POST /api/data` - Store key-value data in cache
- `GET /api/data/:key` - Retrieve data by key

See [API Documentation](../docs/API.md) for detailed endpoint information.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in Docker
npm run test:docker
```

### Test Structure

- **Unit Tests:** Individual function testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Complete workflow testing
- **Coverage Target:** 80% minimum

See [Testing Documentation](../docs/TESTING.md) for more details.

## 🔐 Security Features

- **Helmet.js:** Security headers
- **CORS:** Cross-origin resource sharing configuration
- **Compression:** Response compression
- **Input Validation:** Request validation
- **Error Handling:** Secure error responses

## 📦 Dependencies

### Production

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `redis` - Redis client
- `cors` - CORS middleware
- `helmet` - Security headers
- `compression` - Response compression
- `dotenv` - Environment variables

### Development

- `nodemon` - Auto-restart on file changes
- `jest` - Testing framework
- `supertest` - HTTP assertions

## 🛠️ Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## 🐛 Debugging

### Console Logging

```bash
# View logs in Docker
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Node.js Debugger

```bash
# Start with debugger
node --inspect src/index.js

# Or with nodemon
nodemon --inspect src/index.js
```

Connect with Chrome DevTools at `chrome://inspect`

## 🔄 Database Connections

### MongoDB

```javascript
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));
```

**Connection Status:**
- Check via `/health` endpoint
- Check via `/api/status` endpoint

### Redis

```javascript
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});
```

**Cache Operations:**
- Store: `POST /api/data`
- Retrieve: `GET /api/data/:key`
- TTL: 3600 seconds (1 hour)

## 🚀 Deployment

See [Deployment Documentation](../docs/DEPLOYMENT.md) for production deployment instructions.

### Quick Deploy

```bash
# Build and start
docker-compose up -d --build backend

# Check status
docker-compose ps backend

# View logs
docker-compose logs -f backend
```

## 📝 Adding New Endpoints

1. **Define route:**
```javascript
app.get('/api/new-endpoint', async (req, res) => {
  try {
    // Implementation
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

2. **Add tests:**
```javascript
describe('GET /api/new-endpoint', () => {
  it('should return success', async () => {
    const response = await request(app).get('/api/new-endpoint');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

3. **Update documentation:**
- Update [API.md](../docs/API.md)
- Add JSDoc comments

## 🤝 Contributing

See [Contributing Guidelines](../docs/CONTRIBUTING.md) for:
- Code style guidelines
- Commit message format
- Pull request process
- Testing requirements

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Jest Documentation](https://jestjs.io/)

## 📄 License

MIT License - See LICENSE file in project root

---

**Need help?** Check the [main README](../README.md) or open an issue on GitHub.
