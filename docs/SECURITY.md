# Security Policy - xRat Ecosystem

## 🔒 Security Overview

The xRat Ecosystem takes security seriously. This document outlines our security policies, best practices, and procedures for reporting vulnerabilities.

**Last Updated**: October 5, 2025  
**Security Incident**: API Key exposure remediated (details below)

---

## 📋 Table of Contents

- [Supported Versions](#supported-versions)
- [Recent Security Incident](#recent-security-incident)
- [API Key Rotation Procedure](#api-key-rotation-procedure)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Security Best Practices](#security-best-practices)
- [Security Features](#security-features)
- [Automated Security Scanning](#automated-security-scanning)
- [Known Security Considerations](#known-security-considerations)
- [Security Checklist](#security-checklist)

---

## 🔖 Supported Versions

We release security updates for the following versions:

| Version | Supported          | Notes                  |
| ------- | ------------------ | ---------------------- |
| 1.1.x   | :white_check_mark: | Current stable release |
| 1.0.x   | :white_check_mark: | Security fixes only    |
| < 1.0   | :x:                | No longer supported    |

---

## 🚨 Recent Security Incident

### API Key Exposure (October 4-5, 2025)

**Status**: ✅ RESOLVED

**Summary**: A Google Gemini API key was inadvertently exposed in `bin/gemini-helper.js` (commit `ab62be6`).

**Timeline**:

- **October 4, 2025**: API key committed to repository in PR #30
- **October 5, 2025**: Vulnerability discovered and remediated

**Actions Taken**:

1. ✅ Removed hardcoded API key from codebase (commit `80724b4`)
2. ✅ Added mandatory environment variable validation
3. ✅ Implemented secret scanning workflows (TruffleHog, Gitleaks, detect-secrets)
4. ✅ Added pre-commit hooks for secret detection
5. ⚠️ **ACTION REQUIRED**: Original API key must be rotated

**Affected Files**:

- `bin/gemini-helper.js` (fixed)
- `.gemini/settings.json` (local only, not in repository)

**Remediation Commits**:

- Security fix: `80724b4`
- Secret scanning: `[pending commit]`

---

## 🔑 API Key Rotation Procedure

### When to Rotate API Keys

Immediately rotate API keys if:

- ✅ Key is committed to version control
- ✅ Key is shared in plain text (email, chat, etc.)
- ✅ Suspicious activity detected on the key
- ✅ Team member with key access leaves
- ✅ Regular rotation schedule (recommended: every 90 days)

### How to Rotate Google Gemini API Key

1. **Revoke Compromised Key**:

   ```bash
   # Visit Google AI Studio
   https://aistudio.google.com/app/apikey

   # Steps:
   # 1. Sign in with your Google account
   # 2. Locate the compromised key
   # 3. Click "Delete" or "Revoke"
   # 4. Confirm deletion
   ```

2. **Create New API Key**:

   ```bash
   # In Google AI Studio:
   # 1. Click "Create API Key"
   # 2. Select appropriate project
   # 3. Copy the new key immediately
   # 4. Store securely (never commit to git!)
   ```

3. **Update Local Environment**:

   ```bash
   # Set environment variable
   export GEMINI_API_KEY="your-new-api-key-here"

   # Make it permanent (choose one):

   # For bash:
   echo 'export GEMINI_API_KEY="your-new-key"' >> ~/.bashrc
   source ~/.bashrc

   # For zsh:
   echo 'export GEMINI_API_KEY="your-new-key"' >> ~/.zshrc
   source ~/.zshrc

   # For fish:
   set -Ux GEMINI_API_KEY "your-new-key"
   ```

4. **Update GitHub Secrets** (if applicable):

   ```bash
   # Navigate to:
   https://github.com/xLabInternet/xRatEcosystem/settings/secrets/actions

   # Update secret:
   # Name: GEMINI_API_KEY
   # Value: [your-new-key]
   ```

5. **Verify New Key**:

   ```bash
   # Test the script
   node bin/gemini-helper.js

   # Should connect successfully
   ```

6. **Document Rotation**:
   ```bash
   # Update internal security log with:
   # - Date of rotation
   # - Reason for rotation
   # - Who performed rotation
   # - Verification that old key was revoked
   ```

### Other API Keys Rotation

For other API keys (GitHub, Docker, etc.), follow similar procedures:

1. Generate new key in respective service
2. Update environment variables
3. Update GitHub Secrets
4. Revoke old key
5. Test and verify
6. Document the change

---

## 🚨 Reporting a Vulnerability

### How to Report

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. **DO NOT** disclose the vulnerability publicly until it has been addressed

**Report via:**

- **Email:** security@xrat-ecosystem.com (future)
- **GitHub Security Advisory:** Use the "Security" tab on GitHub
- **Private message:** Contact maintainers directly

### What to Include

Please provide:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: Within 24-48 hours
  - High: Within 7 days
  - Medium: Within 30 days
  - Low: Next regular release

### Disclosure Policy

We follow **responsible disclosure**:

1. Security issue reported to maintainers
2. Maintainers confirm and assess severity
3. Fix is developed and tested
4. Security advisory is published
5. Fix is released
6. Public disclosure after users have time to update (typically 7-14 days)

---

## 🤖 Automated Security Scanning

### Overview

The xRat Ecosystem implements multiple layers of automated security scanning to prevent secrets exposure and detect vulnerabilities.

### Secret Detection Tools

#### 1. **TruffleHog** (GitHub Actions)

- **What it does**: Scans git history for high-entropy secrets and verified credentials
- **When it runs**: Every push, pull request, and weekly
- **Workflow**: `.github/workflows/secret-scan.yml`
- **Features**:
  - Detects 700+ secret types
  - Verifies credentials against live services
  - Scans entire git history
  - Only alerts on verified secrets (reduces false positives)

#### 2. **Gitleaks** (GitHub Actions)

- **What it does**: Fast, configurable secret scanner
- **When it runs**: Every push and pull request
- **Workflow**: `.github/workflows/secret-scan.yml`
- **Features**:
  - Pre-configured rules for common secrets
  - SARIF output for GitHub Security tab
  - Customizable patterns

#### 3. **detect-secrets** (Pre-commit + CI)

- **What it does**: Baseline-based secret detection
- **When it runs**:
  - Pre-commit hook (local)
  - GitHub Actions (CI)
  - PR checks
- **Configuration**: `.secrets.baseline`
- **Features**:
  - Creates baseline of "known" secrets
  - Only alerts on new secrets
  - Low false positive rate
  - Integrated with Husky pre-commit hooks

### Workflow Integration

#### Secret Scanning Workflow

```yaml
# Runs on: push, pull_request, schedule (weekly)
File: .github/workflows/secret-scan.yml

Jobs: 1. TruffleHog scan (verified secrets only)
  2. Gitleaks scan (all patterns)
  3. detect-secrets baseline check
  4. Summary report
```

#### PR Checks Integration

```yaml
# Blocks PRs with exposed secrets
File: .github/workflows/pr-checks.yml

Jobs:
  secret-scan:
    - detect-secrets baseline validation
    - TruffleHog verified secrets check
    - Fails PR if secrets detected
```

#### Pre-commit Hooks

```bash
# Prevents commits with secrets
File: .husky/pre-commit

Steps:
  1. Run detect-secrets scan
  2. Compare against baseline
  3. Block commit if new secrets found
  4. Run lint-staged for code quality
```

### How to Use

#### For Developers

**Before Committing:**

```bash
# Automatic via Husky pre-commit hook
git commit -m "your message"

# Manual scan:
detect-secrets scan --baseline .secrets.baseline
```

**Update Baseline** (if false positive):

```bash
# Re-generate baseline
detect-secrets scan > .secrets.baseline

# Audit and mark false positives
detect-secrets audit .secrets.baseline
```

**View Scan Results:**

```bash
# In GitHub Actions:
# 1. Go to Actions tab
# 2. Select "Secret Scanning" workflow
# 3. View detailed results

# Locally:
detect-secrets scan --baseline .secrets.baseline --verbose
```

### Dependency Vulnerability Scanning

#### GitHub Dependabot

- **Automatic**: Enabled on repository
- **Alerts**: Security tab → Dependabot alerts
- **Auto-PRs**: Creates PRs to update vulnerable dependencies
- **Configuration**: `.github/dependabot.yml` (if needed)

#### npm audit

```bash
# Check for vulnerabilities
npm audit

# Auto-fix (non-breaking)
npm audit fix

# Fix with breaking changes
npm audit fix --force

# View detailed report
npm audit --json
```

### Security Monitoring

#### GitHub Advanced Security (if enabled)

- **Code Scanning**: CodeQL analysis
- **Secret Scanning**: GitHub's built-in scanner
- **Dependency Review**: PR-based dependency analysis
- **Security Overview**: Dashboard with all alerts

### Incident Response

If a secret is detected:

1. **Immediate Actions**:

   ```bash
   # Stop! Do not force push to hide it
   # Secrets remain in git history even after deletion

   # 1. Revoke/rotate the exposed secret immediately
   # 2. Update local environment variables
   # 3. Update GitHub Secrets (if applicable)
   ```

2. **Fix the Code**:

   ```bash
   # Remove hardcoded secret
   # Replace with environment variable
   git add <fixed-files>
   git commit -m "security: Remove exposed secret"
   ```

3. **Verify Clean History**:

   ```bash
   # Scan git history
   git log -p --all -S 'your-secret-pattern'

   # Use TruffleHog
   trufflehog git file://. --only-verified
   ```

4. **Document the Incident**:
   - Update SECURITY.md with incident details
   - Note which secret was exposed
   - Document remediation steps
   - Set up monitoring for the new secret

### Prevention Checklist

- ✅ Never commit `.env` files
- ✅ Use `.gitignore` for sensitive files
- ✅ Store secrets in environment variables
- ✅ Use GitHub Secrets for CI/CD
- ✅ Enable pre-commit hooks (Husky)
- ✅ Review PRs for hardcoded secrets
- ✅ Run `npm audit` regularly
- ✅ Monitor Dependabot alerts
- ✅ Rotate secrets periodically (every 90 days)
- ✅ Use strong, randomly generated secrets

---

## 🛡️ Security Best Practices

### Environment Variables

**DO:**

- Store secrets in `.env` file (never commit!)
- Use strong, randomly generated passwords
- Rotate credentials regularly
- Use different credentials for each environment

**DON'T:**

- Commit `.env` files to Git
- Hardcode secrets in source code
- Share credentials via insecure channels
- Use default or weak passwords

**Example:**

```bash
# Good
MONGODB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Bad
MONGODB_PASSWORD=password123
REDIS_PASSWORD=redis
JWT_SECRET=mysecret
```

### Database Security

**MongoDB:**

- Enable authentication (required in production)
- Use strong passwords
- Limit network access (internal only)
- Enable audit logging
- Regular backups
- Keep MongoDB updated

```bash
# MongoDB with authentication
MONGODB_URI=mongodb://admin:strong_password@mongo:27017/xrat?authSource=admin
```

**Redis:**

- Require password authentication
- Bind to localhost/internal network only
- Disable dangerous commands in production
- Enable persistence for important data
- Regular backups

```bash
# Redis configuration
requirepass your_strong_password
bind 127.0.0.1
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

### Network Security

**Docker Network Isolation:**

- MongoDB and Redis are NOT exposed to host
- Only Backend (3000) and Frontend (5173) ports are exposed
- All internal communication via Docker network

**Production Recommendations:**

- Use HTTPS/TLS for all external connections
- Implement reverse proxy (Nginx/Apache)
- Configure firewall rules
- Use VPN for administrative access
- Implement DDoS protection

### Application Security

**Backend:**

- Input validation on all endpoints
- Parameterized queries (prevent SQL/NoSQL injection)
- Rate limiting (future)
- CORS configuration
- Security headers (Helmet.js)
- Request size limits
- JWT for authentication (future)

**Frontend:**

- Sanitize user input
- Implement CSP (Content Security Policy)
- Avoid inline scripts
- Validate data from API
- Secure cookie settings (future)

### Container Security

**Current:**

- Use official Docker images
- Regular security updates
- Volume-mounted data for persistence

**Future Improvements:**

- Run containers as non-root user
- Read-only root filesystem
- Drop unnecessary capabilities
- Use security scanning (Trivy, Snyk)
- Implement resource limits

### Dependency Management

- Regular dependency updates
- Security audits: `npm audit`
- Use lock files (package-lock.json)
- Review dependency licenses
- Minimize dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Frontend
cd frontend && npm audit
cd backend && npm audit
```

---

## 🔐 Security Features

### Current Implementation

#### Helmet.js Security Headers

The backend uses Helmet.js to set secure HTTP headers:

```javascript
app.use(helmet());
```

**Headers set:**

- `X-DNS-Prefetch-Control`
- `X-Frame-Options`
- `Strict-Transport-Security`
- `X-Download-Options`
- `X-Content-Type-Options`
- `X-Permitted-Cross-Domain-Policies`

#### CORS Configuration

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
```

#### Request Compression

Reduces bandwidth usage and improves performance:

```javascript
app.use(compression());
```

#### Input Validation

All API endpoints validate required fields:

```javascript
if (!key || !value) {
  return res.status(400).json({
    success: false,
    message: 'Key and value are required',
  });
}
```

#### JWT Authentication

**Implemented Features:**

- JWT-based authentication with access and refresh tokens
- Password hashing using bcryptjs (10 salt rounds)
- Token-based route protection
- Secure password validation (min 8 chars, letter + number)

**Configuration:**

```javascript
// Access token expires in 1 hour
// Refresh token expires in 7 days
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
```

**Protected Endpoints:**

- `POST /api/data` - Store data (requires valid access token)
- `GET /api/data/:key` - Retrieve data (requires valid access token)
- `POST /api/auth/logout` - Logout user (requires valid access token)
- `GET /api/auth/profile` - Get user profile (requires valid access token)

**Authentication Flow:**

1. User registers with `POST /api/auth/register`
2. User logs in with `POST /api/auth/login` to receive tokens
3. Access token is included in `Authorization: Bearer <token>` header
4. When access token expires, use refresh token to get new access token
5. User can logout to invalidate refresh token

**Security Features:**

- Passwords hashed with bcrypt before storage
- JWT tokens signed with secret keys
- Refresh tokens stored in database for validation
- Passwords never returned in API responses
- Token expiration enforced

#### Rate Limiting

**Implementation:**

**Authentication Endpoints:**

- 5 requests per 15 minutes per IP
- Applies to login and registration endpoints
- Prevents brute force attacks

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
});
```

**General API Endpoints:**

- 100 requests per 15 minutes per IP
- Applies to all `/api/*` routes
- Prevents API abuse

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});
```

**Response on Rate Limit Exceeded:**

```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again later."
}
```

### Future Security Features

- [ ] Role-Based Access Control (RBAC)
- [ ] API Key Management
- [ ] OAuth Integration
- [ ] Two-Factor Authentication (2FA)
- [ ] Enhanced Session Management
- [ ] Audit Logging
- [ ] Encryption at Rest
- [ ] TLS/SSL for Internal Communication

---

## ⚠️ Known Security Considerations

### Development vs Production

**Development Mode:**

- Detailed error messages exposed
- Debug logging enabled
- Authentication required for protected endpoints
- CORS accepts localhost

**Production Mode:**

- Generic error messages
- Minimal logging
- Authentication required for protected endpoints
- CORS restricted to specific domains

### Current Limitations

1. **✅ Authentication:** JWT authentication implemented
   - **Status:** Complete
   - **Features:** Access tokens, refresh tokens, password hashing, rate limiting

2. **✅ Rate Limiting:** Rate limiting implemented
   - **Status:** Complete
   - **Features:** 5 auth attempts per 15min, 100 API requests per 15min

3. **MongoDB & Redis Access:** Exposed on Docker network
   - **Mitigation:** Already isolated from host
   - **Note:** This is acceptable for containerized deployments

4. **No Encryption at Rest:** Data stored unencrypted
   - **Mitigation:** Implement database encryption
   - **Timeline:** Phase 4

5. **No Audit Logging:** Limited security event tracking
   - **Mitigation:** Implement comprehensive audit logging
   - **Timeline:** Phase 3

---

## ✅ Security Checklist

### Development

- [ ] `.env` file in `.gitignore`
- [ ] No secrets in source code
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] Error handling doesn't expose sensitive info

### Deployment

- [ ] Strong passwords generated
- [ ] HTTPS/TLS configured
- [ ] Firewall rules configured
- [ ] Database authentication enabled
- [ ] Redis password set
- [ ] CORS properly configured
- [ ] Container security scanning enabled
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured

### Production

- [ ] Environment set to production
- [ ] Debug mode disabled
- [ ] Detailed errors hidden
- [x] Rate limiting enabled
- [x] Authentication implemented
- [ ] Audit logging enabled (future)
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] Access controls reviewed
- [ ] SSL certificates valid and auto-renewing

---

## 🔍 Security Scanning

### Automated Scanning

We use the following tools:

- **npm audit:** Dependency vulnerability scanning
- **Dependabot:** Automated dependency updates
- **CodeQL:** Code security analysis (future)
- **Trivy:** Container vulnerability scanning (future)

### Manual Security Review

Regular security reviews include:

- Code review for security issues
- Dependency audit
- Configuration review
- Access control review
- Incident response testing

---

## 📚 Security Resources

### General Security

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### Specific Technologies

- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [Redis Security](https://redis.io/topics/security)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

### Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Trivy](https://github.com/aquasecurity/trivy)

---

## 🚀 Security Roadmap

### Phase 3 (Authentication & Authorization)

- [x] Implement JWT authentication
- [x] Add user registration and login
- [ ] Implement role-based access control (RBAC)
- [x] Add API rate limiting
- [x] Implement basic session management (JWT tokens)
- [ ] Add audit logging

### Phase 4 (Advanced Security)

- [ ] Implement encryption at rest
- [ ] Add two-factor authentication
- [ ] Implement API key management
- [ ] Add OAuth integration
- [ ] Implement security monitoring
- [ ] Add intrusion detection

### Phase 5 (Compliance)

- [ ] GDPR compliance
- [ ] SOC 2 compliance preparation
- [ ] Security certifications
- [ ] Penetration testing
- [ ] Security documentation

---

## 📞 Contact

For security concerns:

- **Security Email:** security@xrat-ecosystem.com (future)
- **GitHub Security:** Use Security tab
- **Maintainer:** Via private message

---

## 🏆 Hall of Fame

We appreciate security researchers who responsibly disclose vulnerabilities:

<!-- Contributors will be listed here -->

---

## 📄 License

This security policy is part of the xRat Ecosystem project and is licensed under the MIT License.

---

**Last Updated:** 2025-01-03  
**Version:** 1.0.0  
**Review Cycle:** Quarterly
