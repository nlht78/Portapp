# Security Guidelines

## 🔒 Critical Files Never Commit to Git

### Environment Variables
- `.env` files (server/.env, client/.env)
- `.env.local`, `.env.production`, `.env.development`
- Any file containing API keys, passwords, or secrets

### Database Files
- Database dumps (`.sql`, `.dump`)
- Database files (`.db`, `.sqlite`)
- Backup files (`*.bak`, `*.backup`)

### API Keys & Secrets
- API keys for external services
- JWT secrets
- Database passwords
- Email credentials
- SSL certificates (`.pem`, `.key`, `.crt`)

### Upload Directories
- `server/uploads/`
- `server/public/uploads/`
- User uploaded files

### Log Files
- `server/src/logs/`
- `*.log` files
- Debug logs

### Build Artifacts
- `node_modules/`
- `dist/`, `build/`
- Compiled files

## 🛡️ Security Best Practices

### 1. Environment Variables
```bash
# Create .env file locally (never commit)
cp env.example server/.env
# Edit with your actual values
```

### 2. API Keys Management
- Use environment variables for all API keys
- Never hardcode secrets in source code
- Use different keys for development/production

### 3. Database Security
- Use strong passwords
- Enable authentication
- Use SSL connections in production
- Regular backups (stored separately)

### 4. File Uploads
- Validate file types
- Limit file sizes
- Store uploads outside web root
- Scan for malware

### 5. Authentication
- Use strong JWT secrets
- Implement rate limiting
- Use HTTPS in production
- Regular token rotation

## 🚨 What to Do If Secrets Are Committed

1. **Immediately rotate all exposed secrets**
2. **Remove sensitive data from git history**
3. **Update all environments with new secrets**
4. **Audit access logs for unauthorized usage**

## 📋 Pre-Deployment Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Database credentials are secure
- [ ] API keys are environment variables
- [ ] Upload directories are excluded
- [ ] Log files are excluded
- [ ] Build artifacts are excluded

## 🔍 How to Check for Exposed Secrets

```bash
# Search for potential secrets in code
grep -r "password\|secret\|key\|token" --include="*.js" --include="*.ts" --include="*.json" .

# Check git history for secrets
git log --all --full-history -- .env*

# Use tools like git-secrets or truffleHog
```

## 📞 Security Contact

If you discover a security vulnerability, please contact the development team immediately.
