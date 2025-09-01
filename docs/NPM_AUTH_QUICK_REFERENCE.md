# NPM Authentication Quick Reference

## Setup Checklist

1. **Generate NPM Token**
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to Access Tokens
   - Create "Granular Access Token" with 90-day expiration
   - Permissions: `packages:write` (minimum)
   - Copy token (starts with `npm_`)

2. **Configure GitHub Secret**
   - Go to Repository Settings > Secrets and variables > Actions
   - Add secret: Name=`NPM_TOKEN`, Value=`your-npm-token`

3. **Test in Workflow**
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

## Security Requirements

- **Token Scope**: Specific packages only (never use global scope)
- **Permissions**: Minimum required (`packages:write` for publishing)
- **Expiration**: Maximum 90 days
- **Rotation**: Quarterly (recommended) or monthly (high security)

## Emergency Contacts

- **NPM Support**: support@npmjs.com
- **GitHub Support**: support@github.com
- **Internal Security Team**: [Your team contact]

## Quick Commands

```bash
# Verify token locally (testing only)
npm whoami

# Check package publishing permissions
npm access ls-packages

# Test publish (dry run)
npm publish --dry-run
```

---
**For detailed instructions, see**: [NPM_AUTHENTICATION.md](./NPM_AUTHENTICATION.md)