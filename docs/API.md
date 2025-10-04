# xRat Ecosystem - API Documentation

## 🌐 Base URL

**Development:** `http://localhost:3000`  
**Production:** TBD

## 📋 API Overview

The xRat Ecosystem API provides RESTful endpoints for managing data, monitoring system health, and interacting with the ecosystem services.

## 🔑 Authentication

**Current:** No authentication required  
**Future:** JWT-based authentication

## 📡 Endpoints

### Root Endpoint

#### `GET /`

Get API information and available endpoints.

**Request:**
```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "message": "Welcome to xRat Ecosystem API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

**Status Codes:**
- `200 OK` - Success

---

### Health Check

#### `GET /health`

Check the health status of the backend and its dependencies.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T12:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

**Response Fields:**
- `status` (string): Overall health status (`healthy` or `unhealthy`)
- `timestamp` (string): ISO 8601 timestamp
- `services` (object): Status of each service
  - `mongodb` (string): MongoDB connection status
  - `redis` (string): Redis connection status

**Status Codes:**
- `200 OK` - All services are healthy

**Usage:**
- Health monitoring systems
- Load balancer health checks
- Kubernetes liveness probes

---

### System Status

#### `GET /api/status`

Get detailed system status including database connections and cache test.

**Request:**
```bash
curl http://localhost:3000/api/status
```

**Response (Success):**
```json
{
  "success": true,
  "ecosystem": "xRat",
  "database": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "cache_test": "xRat Ecosystem is running!",
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Connection timeout"
}
```

**Response Fields:**
- `success` (boolean): Operation success status
- `ecosystem` (string): Ecosystem identifier
- `database` (object): Database connection statuses
- `cache_test` (string|null): Test value from Redis cache
- `timestamp` (string): ISO 8601 timestamp
- `error` (string): Error message (only on failure)

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - System error

---

### Store Data

#### `POST /api/data`

Store key-value data in Redis cache with 1-hour TTL.

**Request:**
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user_123",
    "value": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

**Request Body:**
```json
{
  "key": "user_123",
  "value": "any JSON value"
}
```

**Request Fields:**
- `key` (string, required): Unique identifier for the data
- `value` (any, required): Data to store (can be string, number, object, array)

**Response (Success):**
```json
{
  "success": true,
  "message": "Data stored successfully",
  "key": "user_123",
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "message": "Key and value are required"
}
```

**Response (System Error):**
```json
{
  "success": false,
  "error": "Redis connection failed"
}
```

**Status Codes:**
- `200 OK` - Data stored successfully
- `400 Bad Request` - Missing or invalid parameters
- `500 Internal Server Error` - System error

**Cache Details:**
- **Storage:** Redis
- **TTL:** 3600 seconds (1 hour)
- **Key Format:** `data:{key}`
- **Value Format:** JSON string

---

### Retrieve Data

#### `GET /api/data/:key`

Retrieve data from Redis cache by key.

**Request:**
```bash
curl http://localhost:3000/api/data/user_123
```

**URL Parameters:**
- `key` (string, required): The key to retrieve

**Response (Found):**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "source": "cache"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "message": "Data not found"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Redis connection failed"
}
```

**Response Fields:**
- `success` (boolean): Operation success status
- `data` (any): Retrieved data (only on success)
- `source` (string): Data source (always "cache")
- `message` (string): Error message (only on failure)
- `error` (string): System error message (only on system error)

**Status Codes:**
- `200 OK` - Data found and returned
- `404 Not Found` - Data not found or expired
- `500 Internal Server Error` - System error

---

## 🚫 Error Handling

### 404 Not Found

**Response:**
```json
{
  "success": false,
  "message": "Route not found"
}
```

**Triggered by:**
- Accessing undefined routes
- Typos in endpoint URLs

---

### 500 Internal Server Error

**Response (Development):**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

**Response (Production):**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

**Note:** Error details are only shown in development mode for security.

---

## 📊 Rate Limiting

**Current:** No rate limiting  
**Future:** 
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Configurable per endpoint

---

## 🔐 CORS Configuration

**Allowed Origins:**
- Development: `http://localhost:5173`
- Production: Configured via `FRONTEND_URL` environment variable

**Allowed Methods:**
- GET
- POST
- PUT
- DELETE
- OPTIONS

**Credentials:** Allowed

---

## 📦 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

---

## 🎯 Best Practices

### Request Headers

Always include `Content-Type` header for POST requests:
```bash
Content-Type: application/json
```

### Error Handling

Always check the `success` field in responses:
```javascript
const response = await fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key, value })
});

const data = await response.json();

if (data.success) {
  // Handle success
} else {
  // Handle error
  console.error(data.message);
}
```

### Retry Logic

Implement exponential backoff for failed requests:
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## 📝 Examples

### JavaScript / Fetch API

```javascript
// Get system status
const status = await fetch('http://localhost:3000/api/status')
  .then(res => res.json());

// Store data
const storeResult = await fetch('http://localhost:3000/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'myKey',
    value: { data: 'myValue' }
  })
}).then(res => res.json());

// Retrieve data
const data = await fetch('http://localhost:3000/api/data/myKey')
  .then(res => res.json());
```

### cURL

```bash
# Health check
curl http://localhost:3000/health

# Get status
curl http://localhost:3000/api/status

# Store data
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"key":"test","value":"hello"}'

# Retrieve data
curl http://localhost:3000/api/data/test
```

### Python / Requests

```python
import requests

# Health check
health = requests.get('http://localhost:3000/health').json()

# Store data
response = requests.post('http://localhost:3000/api/data', json={
    'key': 'myKey',
    'value': {'data': 'myValue'}
})

# Retrieve data
data = requests.get('http://localhost:3000/api/data/myKey').json()
```

---

## 🔄 Versioning

**Current Version:** v1  
**Strategy:** URL-based versioning (future)

**Future Format:**
```
/api/v1/data
/api/v2/data
```

---

## 📈 Monitoring

### Metrics Endpoints (Future)

- `GET /metrics` - Prometheus metrics
- `GET /api/stats` - API usage statistics

### Logging

All API requests are logged with:
- Timestamp
- HTTP method
- URL path
- Status code
- Response time
- User agent (future)
- IP address (future)

---

## 🚀 Future Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### User Management
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user

### Data Management
- `PUT /api/data/:key` - Update data
- `DELETE /api/data/:key` - Delete data
- `GET /api/data` - List all keys (with pagination)

---

**Last Updated:** 2025-01-03  
**API Version:** 1.0.0  
**Documentation Version:** 1.0.0
