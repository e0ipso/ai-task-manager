---
type: practice
title: SPA renders through two modules under a header CSP
description: >-
  renderMarkdown and renderMermaid are the only render paths. The CSP header is
  why theme-guard.js is external.
tags:
  - sanitization
  - csp
kk_schema_version: 3
kk_id: practice-spa-render-and-csp-boundaries
kk_derived_from: []
kk_relates_to:
  - practice-markdown-policy-needs-its-own-dompurify-instance
kk_depends_on: []
kk_confidence: high
---
All markdown goes through `renderMarkdown` in `src/web/render/markdown.ts`. No screen parses markdown or sanitizes HTML itself. Mermaid goes through `renderMermaid`, with document directives locked by `MERMAID_SECURE_KEYS`.

`serve` sends the CSP as a response header (`CONTENT_SECURITY_POLICY`) with `script-src 'self'` and no hash. That is why the theme pre-paint guard is the external `theme-guard.js`, not an inline script.
