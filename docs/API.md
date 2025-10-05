# xRat Ecosystem - API Documentation

## 🌐 Base URL

**Development:** `http://localhost:3000`  
**Production:** TBD

## 📚 Interactive API Documentation

**🎉 Swagger UI is available at: http://localhost:3000/api-docs**

For the best API documentation experience, visit the interactive Swagger UI which provides:

- ✅ Complete OpenAPI 3.0 specification
- ✅ Try out endpoints directly from your browser
- ✅ Request/response examples with real data
- ✅ Authentication testing
- ✅ Error code documentation
- ✅ Schema definitions

This document provides a text-based reference, but we recommend using the Swagger UI for interactive exploration.

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

## 📦 Data Management

The Data Management API provides comprehensive CRUD operations with advanced features including validation, caching, search, pagination, bulk operations, export, and analytics.

### Create Data

#### `POST /api/data`

Create a new data entity.

**🔒 Authentication Required**

**Request:**

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Data",
    "description": "Data description",
    "content": {"key": "value"},
    "type": "json",
    "tags": ["important", "project-a"],
    "status": "active"
  }'
```

**Request Body:**

```json
{
  "name": "My Data",
  "description": "Optional description",
  "content": "Any JSON value",
  "type": "json",
  "tags": ["tag1", "tag2"],
  "status": "active"
}
```

**Request Fields:**

- `name` (string, required): Name of the data entity (2-100 characters)
- `description` (string, optional): Description (max 500 characters)
- `content` (any, required): Flexible content field (string, number, object, array, boolean)
- `type` (string, optional): Content type - `text`, `json`, `number`, `boolean`, `array`, `object` (auto-detected if not provided)
- `tags` (array, optional): Array of string tags for categorization
- `status` (string, optional): Status - `active`, `archived`, `deleted` (default: `active`)
- `metadata` (object, optional): Additional metadata key-value pairs

**Response (Success):**

```json
{
  "success": true,
  "message": "Data created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Data",
    "description": "Data description",
    "content": { "key": "value" },
    "type": "json",
    "tags": ["important", "project-a"],
    "status": "active",
    "userId": "507f191e810c19729de860ea",
    "createdAt": "2025-01-04T08:00:00.000Z",
    "updatedAt": "2025-01-04T08:00:00.000Z"
  },
  "timestamp": "2025-01-04T08:00:00.000Z"
}
```

**Real-time Notifications:**

When data is created successfully, the following WebSocket events are automatically sent:

1. **User Notification** (`notification` event):
   ```json
   {
     "type": "success",
     "message": "New data entry \"My Data\" has been created",
     "data": {
       "id": "507f1f77bcf86cd799439011",
       "name": "My Data",
       "type": "json"
     },
     "timestamp": "2025-01-04T08:00:00.000Z"
   }
   ```

2. **Data Update Broadcast** (`data:updated` event to subscribers):
   ```json
   {
     "entity": "data",
     "data": { /* full data object */ },
     "timestamp": "2025-01-04T08:00:00.000Z"
   }
   ```

**Status Codes:**

- `201 Created` - Data created successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - System error

---

### List All Data

#### `GET /api/data`

List all data entities with pagination and filtering.

**🔒 Authentication Required**

**Request:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/data?page=1&limit=10&sort=-createdAt&status=active&type=json"
```

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (1-100, default: 10)
- `sort` (string, optional): Sort field (prefix with `-` for descending, default: `-createdAt`)
- `status` (string, optional): Filter by status - `active`, `archived`, `deleted`
- `type` (string, optional): Filter by type - `text`, `json`, `number`, `boolean`, `array`, `object`
- `tags` (string|array, optional): Filter by tags
- `search` (string, optional): Full-text search in name and description

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Data",
      "content": { "key": "value" },
      "type": "json",
      "status": "active",
      "tags": ["important"],
      "createdAt": "2025-01-04T08:00:00.000Z",
      "updatedAt": "2025-01-04T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  },
  "timestamp": "2025-01-04T08:00:00.000Z"
}
```

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - System error

---

### Get Data by ID

#### `GET /api/data/:id`

Retrieve a specific data entity by ID. Results are cached in Redis for improved performance.

**🔒 Authentication Required**

**Request:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/data/507f1f77bcf86cd799439011
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Data",
    "description": "Data description",
    "content": { "key": "value" },
    "type": "json",
    "tags": ["important"],
    "status": "active",
    "userId": "507f191e810c19729de860ea",
    "createdAt": "2025-01-04T08:00:00.000Z",
    "updatedAt": "2025-01-04T08:00:00.000Z"
  },
  "source": "cache",
  "timestamp": "2025-01-04T08:00:00.000Z"
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Data not found"
}
```

**Status Codes:**

- `200 OK` - Data found
- `400 Bad Request` - Invalid ID format
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Data not found
- `500 Internal Server Error` - System error

---

### Update Data

#### `PUT /api/data/:id`

Update an existing data entity. Cache is automatically invalidated.

**🔒 Authentication Required**

**Request:**

```bash
curl -X PUT http://localhost:3000/api/data/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description",
    "tags": ["new-tag"]
  }'
```

**Request Body:**

At least one field must be provided. All fields are optional:

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "content": "New content",
  "type": "text",
  "tags": ["tag1"],
  "status": "archived",
  "metadata": { "key": "value" }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Data updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "description": "Updated description",
    "content": { "key": "value" },
    "type": "json",
    "tags": ["new-tag"],
    "status": "active",
    "userId": "507f191e810c19729de860ea",
    "createdAt": "2025-01-04T08:00:00.000Z",
    "updatedAt": "2025-01-04T08:30:00.000Z"
  },
  "timestamp": "2025-01-04T08:30:00.000Z"
}
```

**Real-time Notifications:**

When data is updated successfully, the following WebSocket events are automatically sent:

1. **User Notification** (`notification` event):
   ```json
   {
     "type": "info",
     "message": "Data entry \"Updated Name\" has been updated",
     "data": {
       "id": "507f1f77bcf86cd799439011",
       "name": "Updated Name",
       "type": "json"
     },
     "timestamp": "2025-01-04T08:30:00.000Z"
   }
   ```

2. **Data Update Broadcast** (`data:updated` event to subscribers):
   ```json
   {
     "entity": "data",
     "data": { /* full updated data object */ },
     "timestamp": "2025-01-04T08:30:00.000Z"
   }
   ```

**Status Codes:**

- `200 OK` - Updated successfully
- `400 Bad Request` - Validation error or invalid ID
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Data not found
- `500 Internal Server Error` - System error

---

### Delete Data

#### `DELETE /api/data/:id`

Delete a data entity. Cache is automatically invalidated.

**🔒 Authentication Required**

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/data/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "message": "Data deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Data",
    "status": "active"
  },
  "timestamp": "2025-01-04T08:40:00.000Z"
}
```

**Status Codes:**

- `200 OK` - Deleted successfully
- `400 Bad Request` - Invalid ID format
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Data not found
- `500 Internal Server Error` - System error

---

### Search Data

#### `GET /api/data/search`

Full-text search across data entities with filters and pagination.

**🔒 Authentication Required**

**Request:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/data/search?search=important&page=1&limit=10&status=active"
```

**Query Parameters:**

- `search` (string, required): Search query for name and description
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `sort` (string, optional): Sort field (default: `-createdAt`)
- `status` (string, optional): Filter by status
- `type` (string, optional): Filter by type
- `tags` (string|array, optional): Filter by tags

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Important Data",
      "content": { "key": "value" },
      "type": "json",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  },
  "query": "important",
  "timestamp": "2025-01-04T08:50:00.000Z"
}
```

**Status Codes:**

- `200 OK` - Search completed
- `400 Bad Request` - Missing search query or invalid parameters
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - System error

---

### Bulk Operations

#### `POST /api/data/bulk`

Perform bulk create, update, or delete operations. Maximum 100 items per request.

**🔒 Authentication Required**

**Request (Bulk Create):**

```bash
curl -X POST http://localhost:3000/api/data/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "operation": "create",
    "data": [
      {
        "name": "Data 1",
        "content": "Content 1"
      },
      {
        "name": "Data 2",
        "content": "Content 2"
      }
    ]
  }'
```

**Request (Bulk Update):**

```bash
curl -X POST http://localhost:3000/api/data/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "operation": "update",
    "data": [
      {
        "id": "507f1f77bcf86cd799439011",
        "updates": {
          "name": "Updated Name"
        }
      }
    ]
  }'
```

**Request (Bulk Delete):**

```bash
curl -X POST http://localhost:3000/api/data/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "operation": "delete",
    "data": [
      {
        "id": "507f1f77bcf86cd799439011"
      },
      {
        "id": "507f1f77bcf86cd799439012"
      }
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Bulk create completed",
  "results": {
    "success": [
      {
        "id": "507f1f77bcf86cd799439011",
        "data": {
          "name": "Data 1",
          "content": "Content 1"
        }
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "data": {
          "name": "Data 2",
          "content": "Content 2"
        }
      }
    ],
    "failed": []
  },
  "summary": {
    "total": 2,
    "succeeded": 2,
    "failed": 0
  },
  "timestamp": "2025-01-04T09:00:00.000Z"
}
```

**Status Codes:**

- `200 OK` - Bulk operation completed (check results for individual successes/failures)
- `400 Bad Request` - Validation error (invalid operation or data)
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - System error

---

### Export Data

#### `GET /api/data/export`

Export data entities in JSON or CSV format with optional filters.

**🔒 Authentication Required**

**Request (JSON):**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/data/export?format=json&status=active"
```

**Request (CSV):**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/data/export?format=csv&type=json" \
  -o data-export.csv
```

**Query Parameters:**

- `format` (string, optional): Export format - `json` or `csv` (default: `json`)
- `status` (string, optional): Filter by status
- `type` (string, optional): Filter by type
- `tags` (string|array, optional): Filter by tags
- `startDate` (ISO date, optional): Filter by creation date (from)
- `endDate` (ISO date, optional): Filter by creation date (to)

**Response (JSON):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Data",
      "content": { "key": "value" },
      "type": "json",
      "status": "active",
      "tags": ["important"],
      "createdAt": "2025-01-04T08:00:00.000Z",
      "updatedAt": "2025-01-04T08:00:00.000Z"
    }
  ],
  "count": 1,
  "exportedAt": "2025-01-04T09:10:00.000Z"
}
```

**Response (CSV):**

```csv
ID,Name,Type,Status,Tags,Created At,Updated At
507f1f77bcf86cd799439011,My Data,json,active,important,2025-01-04T08:00:00.000Z,2025-01-04T08:00:00.000Z
```

**Status Codes:**

- `200 OK` - Export successful
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - System error

---

### Get Analytics

#### `GET /api/data/analytics`

Get data analytics including counts by type, status, and recent activity.

**🔒 Authentication Required**

**Request:**

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/data/analytics
```

**Response:**

```json
{
  "success": true,
  "analytics": {
    "total": 42,
    "byType": {
      "json": 20,
      "text": 15,
      "number": 5,
      "boolean": 2
    },
    "byStatus": {
      "active": 35,
      "archived": 5,
      "deleted": 2
    },
    "recentCount": 12
  },
  "timestamp": "2025-01-04T09:20:00.000Z"
}
```

**Response Fields:**

- `total` (number): Total data entities for the user
- `byType` (object): Count of entities by type
- `byStatus` (object): Count of entities by status
- `recentCount` (number): Count of entities created in the last 7 days

**Status Codes:**

- `200 OK` - Analytics retrieved successfully
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

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","email":"user@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'

# Create data
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"My Data","content":{"key":"value"},"type":"json"}'

# List data
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/data?page=1&limit=10"

# Get data by ID
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/data/507f1f77bcf86cd799439011
```

### Python / Requests

```python
import requests

# Health check
health = requests.get('http://localhost:3000/health').json()

# Login
auth_response = requests.post('http://localhost:3000/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'Password123'
})
token = auth_response.json()['data']['accessToken']

# Create data
headers = {'Authorization': f'Bearer {token}'}
response = requests.post('http://localhost:3000/api/data',
    json={
        'name': 'My Data',
        'content': {'key': 'value'},
        'type': 'json'
    },
    headers=headers
)

# List data
data_list = requests.get('http://localhost:3000/api/data?page=1&limit=10',
    headers=headers).json()

# Get data by ID
data = requests.get('http://localhost:3000/api/data/507f1f77bcf86cd799439011',
    headers=headers).json()
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

## 🔌 WebSocket Real-Time Communication

The xRat Ecosystem supports real-time bidirectional communication using Socket.IO for live updates, notifications, and presence tracking.

### WebSocket URL

**Development:** `ws://localhost:3000`  
**Production:** TBD

### Authentication

WebSocket connections require JWT authentication. Include your access token when connecting:

**JavaScript Client:**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});
```

**Alternative:** Include token in Authorization header:

```javascript
const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: 'Bearer YOUR_ACCESS_TOKEN'
  }
});
```

### Connection Events

#### `connected`

Emitted when connection is successfully established.

**Payload:**

```json
{
  "socketId": "abc123",
  "userId": "user_id_here",
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

#### `connect_error`

Emitted when connection fails (e.g., invalid token).

**Example:**

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // 'Authentication required' or 'Authentication failed'
});
```

### Server Events (Received by Client)

#### `data:updated`

Real-time data update broadcast to subscribers.

**Payload:**

```json
{
  "entity": "products",
  "data": {
    "_id": "123",
    "name": "Updated Product",
    "price": 99.99
  },
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

**Usage:**

```javascript
socket.on('data:updated', (update) => {
  console.log(`Data updated in ${update.entity}:`, update.data);
});
```

#### `notification`

Push notification sent to specific user.

**Payload:**

```json
{
  "type": "info",
  "message": "Your order has been shipped",
  "user": "user_id",
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

**Notification Types:**
- `info` - Informational message
- `warning` - Warning message
- `error` - Error notification
- `success` - Success notification

**Usage:**

```javascript
socket.on('notification', (notification) => {
  console.log(`[${notification.type}] ${notification.message}`);
});
```

#### `user:online`

User presence status broadcast.

**Payload:**

```json
{
  "userId": "user_id_here",
  "status": "online",
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

**Status Values:**
- `online` - User is connected
- `offline` - User disconnected

**Usage:**

```javascript
socket.on('user:online', (status) => {
  console.log(`User ${status.userId} is now ${status.status}`);
});
```

#### `system:health`

System health metrics broadcast.

**Payload:**

```json
{
  "status": "ok",
  "metrics": {
    "cpu": 45.2,
    "memory": 78.5,
    "connections": 150
  },
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

**Usage:**

```javascript
socket.on('system:health', (health) => {
  console.log('System metrics:', health.metrics);
});
```

#### `user:typing`

User typing indicator in a room.

**Payload:**

```json
{
  "userId": "user_id",
  "username": "johndoe",
  "timestamp": "2025-01-04T12:00:00.000Z"
}
```

#### `notification:read:ack`

Acknowledgment that notification was marked as read.

**Payload:**

```json
{
  "notificationId": "notif_123"
}
```

#### `data:subscribed`

Confirmation of successful subscription to data updates.

**Payload:**

```json
{
  "entity": "products",
  "filters": { "category": "electronics" },
  "room": "data:products:category:electronics"
}
```

### Client Events (Sent by Client)

#### `data:subscribe`

Subscribe to real-time updates for a specific entity.

**Emit:**

```javascript
socket.emit('data:subscribe', {
  entity: 'products',
  filters: { category: 'electronics' }
});

// Listen for subscription confirmation
socket.on('data:subscribed', (confirmation) => {
  console.log('Subscribed to:', confirmation.room);
});
```

**Payload:**

```json
{
  "entity": "products",
  "filters": {
    "category": "electronics"
  }
}
```

**Notes:**
- Filters are optional
- Multiple subscriptions allowed per connection
- Updates are sent to the room automatically

#### `notification:read`

Mark a notification as read.

**Emit:**

```javascript
socket.emit('notification:read', {
  notificationId: 'notif_123'
});

// Listen for acknowledgment
socket.on('notification:read:ack', (ack) => {
  console.log('Notification marked as read:', ack.notificationId);
});
```

**Payload:**

```json
{
  "notificationId": "notif_123"
}
```

#### `user:typing`

Broadcast typing status to a room.

**Emit:**

```javascript
socket.emit('user:typing', {
  roomId: 'chat-room-1'
});
```

**Payload:**

```json
{
  "roomId": "chat-room-1"
}
```

**Notes:**
- Broadcast to all users in the room except sender
- Typically used for chat-like features

### Rate Limiting

WebSocket connections are rate-limited to prevent abuse:

- **Limit:** 100 messages per minute per connection
- **Window:** 60 seconds (rolling window)
- **Exceeded:** Connection receives error event

**Error Response:**

```json
{
  "message": "Rate limit exceeded"
}
```

**Handling:**

```javascript
socket.on('error', (error) => {
  if (error.message === 'Rate limit exceeded') {
    console.warn('Slow down! Too many messages sent.');
  }
});
```

### Offline Message Queuing

Messages sent to offline users are automatically queued in Redis:

- **Storage:** Redis lists
- **TTL:** 7 days
- **Delivery:** Automatic on reconnection
- **Max Size:** No explicit limit (managed by Redis)

**Automatic Delivery:**

When a user reconnects, all queued notifications are automatically sent:

```javascript
socket.on('notification', (notification) => {
  if (notification.queuedAt) {
    console.log('Offline message:', notification);
  }
});
```

### WebSocket Statistics

Get real-time connection statistics.

#### `GET /api/websocket/stats`

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalConnections": 25,
    "connectedUsers": 18,
    "activeRooms": 12
  }
}
```

**Fields:**
- `totalConnections` - Total active WebSocket connections
- `connectedUsers` - Number of unique connected users
- `activeRooms` - Number of active subscription rooms

### Complete Example

```javascript
import { io } from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('connected', (data) => {
  console.log('Connection confirmed:', data);
  
  // Subscribe to product updates
  socket.emit('data:subscribe', {
    entity: 'products',
    filters: { category: 'electronics' }
  });
});

// Listen for data updates
socket.on('data:updated', (update) => {
  console.log('Data updated:', update);
  // Update UI with new data
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Show notification to user
  
  // Mark as read
  socket.emit('notification:read', {
    notificationId: notification.id
  });
});

// User presence
socket.on('user:online', (status) => {
  console.log(`User ${status.userId} is ${status.status}`);
  // Update user list in UI
});

// Error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Socket.IO will automatically reconnect
});
```

### Best Practices

1. **Authentication**
   - Always include a valid JWT token
   - Refresh tokens before they expire
   - Handle authentication errors gracefully

2. **Rate Limiting**
   - Batch updates when possible
   - Avoid sending rapid consecutive messages
   - Implement client-side throttling

3. **Connection Management**
   - Let Socket.IO handle reconnection automatically
   - Clean up event listeners on component unmount
   - Handle connection state in your UI

4. **Error Handling**
   - Always listen for `connect_error` and `error` events
   - Implement retry logic for failed operations
   - Show user-friendly error messages

5. **Performance**
   - Subscribe only to necessary data streams
   - Unsubscribe when no longer needed
   - Use filters to reduce message volume

### Troubleshooting

**Connection Fails:**
- Verify JWT token is valid and not expired
- Check WebSocket URL is correct
- Ensure CORS is configured properly

**Not Receiving Updates:**
- Verify subscription with `data:subscribed` event
- Check filters match your data
- Ensure you're in the correct room

**Rate Limit Exceeded:**
- Reduce message frequency
- Implement client-side throttling
- Check for message loops

---

## 🚀 Future Endpoints

### User Management

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user

### Advanced Features

- `GET /metrics` - Prometheus metrics
- `GET /api/stats` - API usage statistics
- `POST /api/data/backup` - Backup data
- `POST /api/data/restore` - Restore data from backup

---

**Last Updated:** 2025-01-04  
**API Version:** 1.0.0  
**Documentation Version:** 1.1.0 (WebSocket support added)
