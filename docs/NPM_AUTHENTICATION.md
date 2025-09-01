# NPM Authentication Configuration Guide

This document provides comprehensive instructions for configuring secure NPM authentication for automated package publishing in GitHub Actions CI/CD pipelines.

## Table of Contents

1. [Overview](#overview)
2. [NPM Token Generation](#npm-token-generation)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [Token Scoping and Permissions](#token-scoping-and-permissions)
5. [Security Best Practices](#security-best-practices)
6. [Token Rotation Strategy](#token-rotation-strategy)
7. [Emergency Procedures](#emergency-procedures)
8. [Troubleshooting](#troubleshooting)

## Overview

NPM authentication is required for automated package publishing in CI/CD pipelines. This guide covers setting up secure authentication using NPM access tokens stored in GitHub Secrets.

### Prerequisites

- NPM account with publishing permissions
- GitHub repository with Actions enabled
- Package configured for publication
- Repository maintainer access

## NPM Token Generation

### Step 1: Access NPM Token Settings

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click on your profile icon in the top right
3. Select "Access Tokens" from the dropdown menu
4. Click "Generate New Token"

### Step 2: Configure Token Settings

Choose the appropriate token type based on your needs:

#### Classic Token (Recommended for CI/CD)

- **Token Type**: Classic Token
- **Type**: Automation
- **Scope**: Select appropriate packages or organization

#### Granular Access Token (Enhanced Security)

- **Token Type**: Granular Access Token
- **Expiration**: Set to 90 days or organization policy
- **Organizations**: Select your organization
- **Packages**: Select specific packages to publish
- **Permissions**:
  - `packages:read` (if needed for dependency resolution)
  - `packages:write` (required for publishing)

### Step 3: Generate and Save Token

1. Review token configuration
2. Click "Generate Token"
3. **IMPORTANT**: Copy the token immediately - it won't be shown again
4. Store the token securely (we'll add it to GitHub Secrets next)

### Token Format Example

```
npm_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## GitHub Secrets Configuration

### Step 1: Access Repository Secrets

1. Go to your GitHub repository
2. Click "Settings" tab
3. In the left sidebar, click "Secrets and variables"
4. Select "Actions"

### Step 2: Add NPM_TOKEN Secret

1. Click "New repository secret"
2. **Name**: `NPM_TOKEN`
3. **Value**: Paste your NPM access token
4. Click "Add secret"

### Step 3: Verify Secret Configuration

The secret should appear in your repository secrets list as:
- **Name**: `NPM_TOKEN`
- **Updated**: Current timestamp
- **Used**: Will show usage after first workflow run

### Using in GitHub Actions

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    registry-url: 'https://registry.npmjs.org'

- name: Publish to NPM
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Token Scoping and Permissions

### Classic Token Scopes

| Scope Type | Use Case | Security Level | Recommended For |
|------------|----------|----------------|-----------------|
| Read-only | Dependency installation | Low risk | Public packages |
| Publish | Package publishing | Medium risk | Automated CI/CD |
| Automation | Full automation access | High risk | Dedicated CI accounts |

### Granular Token Permissions

| Permission | Description | Required For | Risk Level |
|------------|-------------|--------------|------------|
| `packages:read` | Read package metadata and downloads | Dependency resolution | Low |
| `packages:write` | Publish and modify packages | Publishing workflows | High |
| `packages:delete` | Delete packages/versions | Cleanup operations | Critical |

### Recommended Configuration

For CI/CD publishing:

```yaml
Token Type: Granular Access Token
Expiration: 90 days
Organizations: [Your Organization]
Packages: [Specific packages only]
Permissions:
  - packages:read (if needed)
  - packages:write
```

## Security Best Practices

### Token Management

1. **Principle of Least Privilege**
   - Grant minimum necessary permissions
   - Scope tokens to specific packages
   - Use granular permissions when possible

2. **Token Rotation**
   - Rotate tokens every 90 days maximum
   - Set calendar reminders for rotation
   - Document rotation procedures

3. **Access Control**
   - Limit GitHub repository access
   - Use separate tokens for different environments
   - Audit token usage regularly

### Environment Separation

```yaml
# Production
NPM_TOKEN: ${{ secrets.NPM_TOKEN_PROD }}

# Staging
NPM_TOKEN: ${{ secrets.NPM_TOKEN_STAGING }}

# Development
NPM_TOKEN: ${{ secrets.NPM_TOKEN_DEV }}
```

### Monitoring and Auditing

1. **Enable NPM Audit Logging**
   - Monitor token usage in NPM dashboard
   - Review publish activities regularly
   - Set up alerts for unexpected usage

2. **GitHub Actions Monitoring**
   - Review workflow runs for token usage
   - Monitor for failed authentication attempts
   - Set up notifications for secret access

## Token Rotation Strategy

### Scheduled Rotation (Recommended)

#### Quarterly Rotation Process

1. **Week 1**: Generate new token
2. **Week 2**: Update GitHub Secrets
3. **Week 3**: Test CI/CD pipeline
4. **Week 4**: Revoke old token

#### Monthly Rotation (High Security)

For critical packages or security-sensitive environments:

1. **Day 1**: Generate new token
2. **Day 2**: Update secrets and test
3. **Day 3**: Revoke old token
4. **Document**: Update rotation log

### Rotation Checklist

- [ ] Generate new NPM token with same permissions
- [ ] Update `NPM_TOKEN` in GitHub Secrets
- [ ] Trigger test workflow to verify authentication
- [ ] Monitor first few CI/CD runs
- [ ] Revoke old token in NPM dashboard
- [ ] Update documentation/logs
- [ ] Schedule next rotation

### Automation Script Template

```bash
#!/bin/bash
# NPM Token Rotation Script Template

echo "🔄 Starting NPM Token Rotation Process"

# Step 1: Verify current token (manual)
echo "1. Generate new NPM token manually"
read -p "Enter new token: " NEW_TOKEN

# Step 2: Update GitHub Secrets (requires gh CLI)
echo "2. Updating GitHub Secrets"
echo "$NEW_TOKEN" | gh secret set NPM_TOKEN

# Step 3: Test workflow
echo "3. Triggering test workflow"
gh workflow run test-publish.yml

echo "✅ Token rotation initiated. Monitor workflow results."
```

## Emergency Procedures

### Token Compromise Response

If you suspect your NPM token has been compromised:

#### Immediate Actions (< 5 minutes)

1. **Revoke Token**
   - Go to NPM > Access Tokens
   - Find compromised token
   - Click "Revoke" immediately

2. **Generate New Token**
   - Create new token with same permissions
   - Update GitHub Secrets immediately

3. **Monitor Activity**
   - Check NPM audit logs
   - Review recent package publications
   - Check for unauthorized changes

#### Follow-up Actions (< 1 hour)

1. **Security Assessment**
   - Review how token was compromised
   - Check related systems for exposure
   - Update security procedures

2. **Communication**
   - Notify team of incident
   - Document compromise details
   - Update security training

### Backup Authentication Methods

#### Service Account Setup

For critical packages, consider dedicated service accounts:

```yaml
# Separate NPM account for automation
Account: your-org-ci@company.com
Purpose: Automated publishing only
Permissions: Limited to specific packages
Monitoring: Enhanced audit logging
```

#### Organization-Level Tokens

For organizations, use org-level tokens:

```yaml
Token Level: Organization
Management: Centralized by org admins
Scope: Organization packages only
Rotation: Coordinated across teams
```

## Troubleshooting

### Common Authentication Issues

#### Error: "Authentication failed"

```yaml
Error: npm ERR! code E401
Error: npm ERR! 401 Unauthorized - PUT https://registry.npmjs.org/package-name
```

**Solutions:**
1. Verify `NPM_TOKEN` secret exists and is correct
2. Check token hasn't expired
3. Confirm token has publishing permissions
4. Verify package name and scoping

#### Error: "Token invalid"

```yaml
Error: npm ERR! code EAUTHUNKNOWN
Error: npm ERR! Unable to authenticate
```

**Solutions:**
1. Regenerate NPM token
2. Update GitHub Secrets
3. Check token format (should start with `npm_`)

#### Error: "Insufficient permissions"

```yaml
Error: npm ERR! code E403
Error: npm ERR! 403 Forbidden
```

**Solutions:**
1. Check token permissions include `packages:write`
2. Verify token scope includes target package
3. Confirm user has publishing rights

### Verification Commands

```bash
# Test token locally (never commit this)
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > ~/.npmrc
npm whoami

# Test in GitHub Actions
- name: Verify NPM Authentication
  run: |
    echo "//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}" > ~/.npmrc
    npm whoami
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Support Resources

- **NPM Documentation**: [docs.npmjs.com/about-access-tokens](https://docs.npmjs.com/about-access-tokens)
- **GitHub Actions**: [docs.github.com/en/actions/security-guides/encrypted-secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- **Security Issues**: Contact NPM support or GitHub support

---

## Checklist Summary

- [ ] NPM account with publishing permissions configured
- [ ] Appropriate NPM token generated with correct scope
- [ ] `NPM_TOKEN` secret configured in GitHub repository
- [ ] Token permissions verified (packages:write minimum)
- [ ] CI/CD workflow tested with new token
- [ ] Token rotation schedule established (90 days max)
- [ ] Emergency procedures documented and accessible
- [ ] Team trained on token management procedures
- [ ] Monitoring and audit logging enabled

---

**Last Updated**: 2025-09-01
**Next Review**: 2025-12-01
**Token Rotation Due**: [Set based on your schedule]