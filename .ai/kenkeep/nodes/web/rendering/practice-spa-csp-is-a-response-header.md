---
type: practice
title: The SPA's CSP is a response header with script-src 'self' and no hash
description: >-
  CONTENT_SECURITY_POLICY in server.ts is sent as a header because
  frame-ancestors works only there. Inline scripts would break script-src
  'self'.
tags:
  - web
  - serve
  - security
  - csp
  - theme
kk_schema_version: 3
kk_id: practice-spa-csp-is-a-response-header
kk_derived_from: []
kk_relates_to:
  - practice-spa-markdown-and-mermaid-are-the-only-render-boundaries
  - practice-serve-request-security-model
kk_depends_on: []
kk_confidence: high
---
`serve` sends `CONTENT_SECURITY_POLICY` from `src/serve/server.ts` on every static response. The comment above the constant explains each exception. It is a header and not a `<meta http-equiv>` tag because `frame-ancestors` only works in the header form.

`script-src` is `'self'` with no hash and no `unsafe-eval`. Any inline script breaks that. This is why the pre-paint theme guard is the external file `src/web/public/theme-guard.js`, loaded from `index.html`'s `<head>`, and not an inline block. Add new early-boot code the same way.

`style-src` allows `'unsafe-inline'` only because CodeMirror 6 injects `<style>` elements at runtime and mermaid's SVG embeds a `<style>` block, and neither can be hashed ahead of time.

`img-src` allows `data:` because the markdown sanitizer admits bounded `data:image/*` images. If the sanitizer's image rules change, check this directive too.

<!-- kk:related:start -->
# Related

- Related: [practice-spa-markdown-and-mermaid-are-the-only-render-boundaries](practice-spa-markdown-and-mermaid-are-the-only-render-boundaries.md)
- Related: [practice-serve-request-security-model](../../serve/practice-serve-request-security-model.md)
<!-- kk:related:end -->
