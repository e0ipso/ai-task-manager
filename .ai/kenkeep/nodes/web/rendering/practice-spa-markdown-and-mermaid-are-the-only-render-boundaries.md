---
type: practice
title: 'markdown.ts is the only sanitizer, and mermaid ignores document overrides'
description: >-
  Only render/markdown.ts parses and sanitizes markdown. mermaid.ts loads the
  library lazily and blocks directive overrides via MERMAID_SECURE_KEYS.
tags:
  - web
  - rendering
  - security
  - sanitization
  - mermaid
  - dompurify
kk_schema_version: 3
kk_id: practice-spa-markdown-and-mermaid-are-the-only-render-boundaries
kk_derived_from: []
kk_relates_to:
  - practice-markdown-policy-needs-its-own-dompurify-instance
  - >-
    practice-reuse-shared-spa-prose-rendering-components-across-all-markdown-rendering-screens
  - practice-set-suppresserrorrendering-true-in-mermaid-initialization
kk_depends_on: []
kk_confidence: high
---
`src/web/render/markdown.ts` is the only place in the SPA that turns markdown into HTML or sanitizes HTML. It is also the only file that imports `marked` or `dompurify`. Screens call `renderMarkdown` and never parse or sanitize on their own, so the policy cannot drift per screen. The module comment is the full statement of the policy. Read it before changing allowed tags, attributes, URL rules, or the `data:image` cap.

`marked` passes raw HTML through and is not a security layer. DOMPurify, with an explicit allowlist and URL hooks, is the enforcing layer.

The CodeMirror editor in Customize is a separate boundary. It shows raw editable source, never renders it, and never goes through sanitization. There is no preview.

`src/web/render/mermaid.ts` reaches the mermaid library only through the dynamic `import()` inside `renderMermaid`. Importing the module is cheap, and the library loads only when a diagram first renders. It pins `securityLevel: 'strict'` and size limits, and passes `MERMAID_SECURE_KEYS` as mermaid's `secure` list, so a document's `%%{init}%%` directive or front matter cannot override security, theme, font, or label-rendering settings. Mermaid applies that list at every nesting level. Add a bare key such as `htmlLabels`, because a dotted key like `flowchart.htmlLabels` matches nothing.

Mermaid cannot be themed by CSS class alone. Callers pass the resolved scheme to `renderMermaid(source, theme)` and re-render on theme change.

<!-- kk:related:start -->
# Related

- Related: [practice-markdown-policy-needs-its-own-dompurify-instance](practice-markdown-policy-needs-its-own-dompurify-instance.md)
- Related: [practice-reuse-shared-spa-prose-rendering-components-across-all-markdown-rendering-screens](practice-reuse-shared-spa-prose-rendering-components-across-all-markdown-rendering-screens.md)
- Related: [practice-set-suppresserrorrendering-true-in-mermaid-initialization](practice-set-suppresserrorrendering-true-in-mermaid-initialization.md)
<!-- kk:related:end -->
