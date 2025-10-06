/* eslint-disable no-unused-vars */
const request = require('supertest');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');

describe('Swagger API Documentation', () => {
  let app;

  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express();

    // Load OpenAPI specification
    const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
    const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

    // Setup Swagger UI
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'xRat Ecosystem API Documentation',
      })
    );

    // Root endpoint with docs link
    app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to xRat Ecosystem API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
          auth: '/api/v1/auth',
          docs: '/api-docs',
        },
      });
    });
  });

  describe('GET /', () => {
    it('should include api-docs endpoint in root response', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('docs');
      expect(response.body.endpoints.docs).toBe('/api-docs');
    });
  });

  describe('GET /api-docs', () => {
    it('should return Swagger UI HTML', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/html');
      expect(response.text).toContain('swagger-ui');
    });

    it('should have custom site title', async () => {
      const response = await request(app).get('/api-docs/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('xRat Ecosystem API Documentation');
    });
  });

  describe('OpenAPI Specification', () => {
    it('should load valid OpenAPI specification', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      expect(openApiSpec).toBeDefined();
      expect(openApiSpec.openapi).toBe('3.0.0');
      expect(openApiSpec.info).toBeDefined();
      expect(openApiSpec.info.title).toBe('xRat Ecosystem API');
      expect(openApiSpec.info.version).toBe('1.0.0');
    });

    it('should document all required endpoints', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      expect(openApiSpec.paths).toBeDefined();

      // Root endpoint
      expect(openApiSpec.paths['/']).toBeDefined();

      // Health endpoints
      expect(openApiSpec.paths['/health']).toBeDefined();
      expect(openApiSpec.paths['/health/ready']).toBeDefined();
      expect(openApiSpec.paths['/health/live']).toBeDefined();
      expect(openApiSpec.paths['/health/complete']).toBeDefined();

      // Status endpoint
      expect(openApiSpec.paths['/api/v1/status']).toBeDefined();

      // Auth endpoints
      expect(openApiSpec.paths['/api/v1/auth/register']).toBeDefined();
      expect(openApiSpec.paths['/api/v1/auth/login']).toBeDefined();
      expect(openApiSpec.paths['/api/v1/auth/refresh']).toBeDefined();
      expect(openApiSpec.paths['/api/v1/auth/logout']).toBeDefined();
      expect(openApiSpec.paths['/api/v1/auth/profile']).toBeDefined();

      // Data endpoints
      expect(openApiSpec.paths['/api/v1/data']).toBeDefined();
      expect(openApiSpec.paths['/api/v1/data/{key}']).toBeDefined();
    });

    it('should define security schemes for authentication', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      expect(openApiSpec.components).toBeDefined();
      expect(openApiSpec.components.securitySchemes).toBeDefined();
      expect(openApiSpec.components.securitySchemes.BearerAuth).toBeDefined();
      expect(openApiSpec.components.securitySchemes.BearerAuth.type).toBe('http');
      expect(openApiSpec.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
      expect(openApiSpec.components.securitySchemes.BearerAuth.bearerFormat).toBe('JWT');
    });

    it('should define schemas for request/response objects', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      expect(openApiSpec.components.schemas).toBeDefined();

      // Authentication schemas
      expect(openApiSpec.components.schemas.RegisterRequest).toBeDefined();
      expect(openApiSpec.components.schemas.LoginRequest).toBeDefined();
      expect(openApiSpec.components.schemas.AuthResponse).toBeDefined();
      expect(openApiSpec.components.schemas.User).toBeDefined();

      // Health schemas
      expect(openApiSpec.components.schemas.HealthStatus).toBeDefined();
      expect(openApiSpec.components.schemas.ReadinessCheck).toBeDefined();
      expect(openApiSpec.components.schemas.LivenessCheck).toBeDefined();

      // Data management schemas
      expect(openApiSpec.components.schemas.DataStoreRequest).toBeDefined();
      expect(openApiSpec.components.schemas.DataStoreResponse).toBeDefined();
      expect(openApiSpec.components.schemas.DataRetrieveResponse).toBeDefined();

      // Error schema
      expect(openApiSpec.components.schemas.Error).toBeDefined();
    });

    it('should include request/response examples', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      // Check register endpoint has examples
      const registerEndpoint = openApiSpec.paths['/api/v1/auth/register'].post;
      expect(registerEndpoint.requestBody.content['application/json'].examples).toBeDefined();

      // Check login endpoint has examples
      const loginEndpoint = openApiSpec.paths['/api/v1/auth/login'].post;
      expect(loginEndpoint.requestBody.content['application/json'].examples).toBeDefined();

      // Check data store endpoint has examples
      const dataStoreEndpoint = openApiSpec.paths['/api/v1/data'].post;
      expect(dataStoreEndpoint.requestBody.content['application/json'].examples).toBeDefined();
    });

    it('should document error codes properly', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      // Check login endpoint has proper error codes
      const loginEndpoint = openApiSpec.paths['/api/v1/auth/login'].post;
      expect(loginEndpoint.responses['200']).toBeDefined(); // Success
      expect(loginEndpoint.responses['400']).toBeDefined(); // Bad Request
      expect(loginEndpoint.responses['401']).toBeDefined(); // Unauthorized
      expect(loginEndpoint.responses['429']).toBeDefined(); // Rate Limit
      expect(loginEndpoint.responses['500']).toBeDefined(); // Server Error

      // Check protected endpoint has authentication error
      const logoutEndpoint = openApiSpec.paths['/api/v1/auth/logout'].post;
      expect(logoutEndpoint.security).toBeDefined();
      expect(logoutEndpoint.responses['401']).toBeDefined();
    });

    it('should organize endpoints with tags', () => {
      const openApiPath = path.join(__dirname, '../../src/openapi.yaml');
      const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

      expect(openApiSpec.tags).toBeDefined();
      expect(Array.isArray(openApiSpec.tags)).toBe(true);

      const tagNames = openApiSpec.tags.map((tag) => tag.name);
      expect(tagNames).toContain('Root');
      expect(tagNames).toContain('Health');
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Data Management');
    });
  });
});
