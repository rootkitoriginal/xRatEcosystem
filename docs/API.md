# xRat Ecosystem - API Documentation

## 🌐 Base URL

**Development:** `http://localhost:3000`  
**Production:** TBD

## 📋 API Overview

The xRat Ecosystem API provides RESTful endpoints for managing data, monitoring system health, and interacting with the ecosystem services.

## 🔑 Authentication

**Current:** JWT-based authentication  
**Token Type:** Bearer token in Authorization header

### Authentication Flow

1. **Register:** Create a new account with `POST /api/auth/register`
2. **Login:** Get access and refresh tokens with `POST /api/auth/login`
3. **Access Protected Routes:** Include access token in Authorization header
4. **Refresh Token:** Get new access token when expired with `POST /api/auth/refresh`
5. **Logout:** Invalidate refresh token with `POST /api/auth/logout`

### Token Configuration

- **Access Token:** Expires in 1 hour
- **Refresh Token:** Expires in 7 days
- **Password Requirements:** Minimum 8 characters with at least one letter and one number

### Using Authentication

Include the access token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" http://localhost:3000/api/protected-route
```

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
    "api": "/api",
    "auth": "/api/auth"
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

**🔒 Authentication Required**

**Request:**

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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
- `401 Unauthorized` - Missing or invalid authentication token
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

**🔒 Authentication Required**

**Request:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/data/user_123
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
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Data not found or expired
- `500 Internal Server Error` - System error

---

## 🔐 Authentication Endpoints

### Register User

#### `POST /api/auth/register`

Create a new user account.

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Request Fields:**

- `username` (string, required): Username (3-30 characters)
- `email` (string, required): Valid email address
- `password` (string, required): Password (min 8 chars, must contain letter and number)

**Response (Success):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2025-01-03T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Validation Error):**

```json
{
  "success": false,
  "message": "Password must contain at least one letter and one number"
}
```

**Response (Conflict):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Status Codes:**

- `201 Created` - User registered successfully
- `400 Bad Request` - Invalid input or validation error
- `409 Conflict` - Username or email already exists
- `429 Too Many Requests` - Rate limit exceeded (5 attempts per 15 minutes)
- `500 Internal Server Error` - System error

---

### Login User

#### `POST /api/auth/login`

Authenticate user and receive tokens.

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Request Fields:**

- `email` (string, required): User email
- `password` (string, required): User password

**Response (Success):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Status Codes:**

- `200 OK` - Login successful
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded (5 attempts per 15 minutes)
- `500 Internal Server Error` - System error

---

### Refresh Token

#### `POST /api/auth/refresh`

Get a new access token using refresh token.

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Fields:**

- `refreshToken` (string, required): Valid refresh token

**Response (Success):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

**Status Codes:**

- `200 OK` - Token refreshed successfully
- `400 Bad Request` - Missing refresh token
- `401 Unauthorized` - Invalid or expired refresh token
- `500 Internal Server Error` - System error

---

### Logout User

#### `POST /api/auth/logout`

Logout user and invalidate refresh token.

**🔒 Authentication Required**

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Authentication required. Please provide a valid token."
}
```

**Status Codes:**

- `200 OK` - Logout successful
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found
- `500 Internal Server Error` - System error

---

### Get User Profile

#### `GET /api/auth/profile`

Get authenticated user's profile information.

**🔒 Authentication Required**

**Request:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/auth/profile
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2025-01-03T12:00:00.000Z",
      "updatedAt": "2025-01-03T12:00:00.000Z"
    }
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Authentication required. Please provide a valid token."
}
```

**Status Codes:**

- `200 OK` - Profile retrieved successfully
- `401 Unauthorized` - Missing or invalid token
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
  body: JSON.stringify({ key, value }),
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
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## 📝 Examples

### JavaScript / Fetch API

```javascript
// Get system status
const status = await fetch('http://localhost:3000/api/status').then((res) => res.json());

// Store data
const storeResult = await fetch('http://localhost:3000/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'myKey',
    value: { data: 'myValue' },
  }),
}).then((res) => res.json());

// Retrieve data
const data = await fetch('http://localhost:3000/api/data/myKey').then((res) => res.json());
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
