# kenkeep Index: web / rendering

↑ Parent: [web](../index.md)

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
_None._

## Conventions (how we build)
- Open [**Set suppressErrorRendering: true in mermaid initialization**](practice-set-suppresserrorrendering-true-in-mermaid-initialization.md) to learn about: Without this flag, mermaid v11 injects an orphaned error SVG into <body> on parse failure even when the caller catches the error. #mermaid #spa #rendering #error-handling
- Open [**markdown.ts is the only sanitizer, and mermaid ignores document overrides**](practice-spa-markdown-and-mermaid-are-the-only-render-boundaries.md) to learn about: Only render/markdown.ts parses and sanitizes markdown. mermaid.ts loads the library lazily and blocks directive overrides via MERMAID_SECURE_KEYS. #web #rendering #security #sanitization #mermaid #dompurify
- Open [**markdown.ts needs a private DOMPurify instance or mermaid loses every SVG attribute**](practice-markdown-policy-needs-its-own-dompurify-instance.md) to learn about: markdown.ts registers its sanitize hooks on a private DOMPurify instance; on the shared default they also apply to mermaid's strict-mode SVG pass and blank the Graph tab. #web #rendering #mermaid #dompurify #sanitization #gotcha
- Open [**Reuse shared SPA prose-rendering components across all markdown-rendering screens**](practice-reuse-shared-spa-prose-rendering-components-across-all-markdown-rendering-screens.md) to learn about: The project has a standing code-reuse mandate: all markdown-rendering screens must use the shared Section/ReaderProse renderer. #web #spa #components #reuse #architecture
- Open [**The SPA's CSP is a response header with script-src 'self' and no hash**](practice-spa-csp-is-a-response-header.md) to learn about: CONTENT_SECURITY_POLICY in server.ts is sent as a header because frame-ancestors works only there. Inline scripts would break script-src 'self'. #web #serve #security #csp #theme

## Components (what exists)
- Open [**MermaidError.tsx — shared mermaid render-error component**](map-mermaiderror-tsx-shared-mermaid-render-error-component.md) to learn about: src/web/plans/detail/MermaidError.tsx renders a Lucide Frown icon with a collapsed Details disclosure for the verbatim parse error. #mermaid #spa #components #error-handling

## By topic

### #mermaid
- Open [**Set suppressErrorRendering: true in mermaid initialization**](practice-set-suppresserrorrendering-true-in-mermaid-initialization.md) — Without this flag, mermaid v11 injects an orphaned error SVG into <body> on parse failure even when the caller catches the error.
- Open [**markdown.ts is the only sanitizer, and mermaid ignores document overrides**](practice-spa-markdown-and-mermaid-are-the-only-render-boundaries.md) — Only render/markdown.ts parses and sanitizes markdown. mermaid.ts loads the library lazily and blocks directive overrides via MERMAID_SECURE_KEYS.
- Open [**markdown.ts needs a private DOMPurify instance or mermaid loses every SVG attribute**](practice-markdown-policy-needs-its-own-dompurify-instance.md) — markdown.ts registers its sanitize hooks on a private DOMPurify instance; on the shared default they also apply to mermaid's strict-mode SVG pass and blank the Graph tab.
### #web
- Open [**Plan Detail: blueprint markdown section is distinct from the tasks-frontmatter Tasks tab**](../../serve/practice-plan-detail-blueprint-markdown-vs-tasks-frontmatter.md) — Four data sources feed the Plan Detail tabs; the blueprint prose and tasks-frontmatter rendering must not be conflated
- Open [**serve UI PRD and tickets live under .ai/strikethroo/scratch/ui/**](../../serve/map-serve-ui-prd-and-tickets-live-under-ai-strikethroo-scratch-ui.md) — The PRD and 13 dependency-ordered tickets for the serve SPA feature are in .ai/strikethroo/scratch/ui/, not in the formal plans/ flow.
- Open [**Hot-reload dev loop requires three concurrent processes**](../../dev/practice-hot-reload-dev-loop-requires-three-concurrent-processes.md) — Backend: ts-node via node --watch. Frontend: Vite at localhost:5173 with /api/* proxied to localhost:4317. No dist/ involvement.
### #rendering
- Open [**markdown.ts is the only sanitizer, and mermaid ignores document overrides**](practice-spa-markdown-and-mermaid-are-the-only-render-boundaries.md) — Only render/markdown.ts parses and sanitizes markdown. mermaid.ts loads the library lazily and blocks directive overrides via MERMAID_SECURE_KEYS.
- Open [**markdown.ts needs a private DOMPurify instance or mermaid loses every SVG attribute**](practice-markdown-policy-needs-its-own-dompurify-instance.md) — markdown.ts registers its sanitize hooks on a private DOMPurify instance; on the shared default they also apply to mermaid's strict-mode SVG pass and blank the Graph tab.
- Open [**Set suppressErrorRendering: true in mermaid initialization**](practice-set-suppresserrorrendering-true-in-mermaid-initialization.md) — Without this flag, mermaid v11 injects an orphaned error SVG into <body> on parse failure even when the caller catches the error.
### #spa
- Open [**Plan Detail: blueprint markdown section is distinct from the tasks-frontmatter Tasks tab**](../../serve/practice-plan-detail-blueprint-markdown-vs-tasks-frontmatter.md) — Four data sources feed the Plan Detail tabs; the blueprint prose and tasks-frontmatter rendering must not be conflated
- Open [**serve UI PRD and tickets live under .ai/strikethroo/scratch/ui/**](../../serve/map-serve-ui-prd-and-tickets-live-under-ai-strikethroo-scratch-ui.md) — The PRD and 13 dependency-ordered tickets for the serve SPA feature are in .ai/strikethroo/scratch/ui/, not in the formal plans/ flow.
- Open [**Serve SPA has two sanctioned workspace mutations; self-review writes nothing**](../../serve/practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files.md) — Archive moves done plans into archive/. Config writes overwrite one existing allowlisted file. Self-review spawns a process but writes no files.
### #components
- Open [**Reuse shared SPA prose-rendering components across all markdown-rendering screens**](practice-reuse-shared-spa-prose-rendering-components-across-all-markdown-rendering-screens.md) — The project has a standing code-reuse mandate: all markdown-rendering screens must use the shared Section/ReaderProse renderer.
- Open [**Use BaseUI components for interactive UI elements in the SPA**](../ui/practice-use-baseui-components-for-interactive-ui-elements-in-the-spa.md) — @base-ui-components/react is required for all new interactive UI elements; hand-rolled components are pre-mandate legacy.
- Open [**MermaidError.tsx — shared mermaid render-error component**](map-mermaiderror-tsx-shared-mermaid-render-error-component.md) — src/web/plans/detail/MermaidError.tsx renders a Lucide Frown icon with a collapsed Details disclosure for the verbatim parse error.
### #dompurify
- Open [**markdown.ts is the only sanitizer, and mermaid ignores document overrides**](practice-spa-markdown-and-mermaid-are-the-only-render-boundaries.md) — Only render/markdown.ts parses and sanitizes markdown. mermaid.ts loads the library lazily and blocks directive overrides via MERMAID_SECURE_KEYS.
- Open [**markdown.ts needs a private DOMPurify instance or mermaid loses every SVG attribute**](practice-markdown-policy-needs-its-own-dompurify-instance.md) — markdown.ts registers its sanitize hooks on a private DOMPurify instance; on the shared default they also apply to mermaid's strict-mode SVG pass and blank the Graph tab.
### #error-handling
- Open [**Set suppressErrorRendering: true in mermaid initialization**](practice-set-suppresserrorrendering-true-in-mermaid-initialization.md) — Without this flag, mermaid v11 injects an orphaned error SVG into <body> on parse failure even when the caller catches the error.
- Open [**MermaidError.tsx — shared mermaid render-error component**](map-mermaiderror-tsx-shared-mermaid-render-error-component.md) — src/web/plans/detail/MermaidError.tsx renders a Lucide Frown icon with a collapsed Details disclosure for the verbatim parse error.
- Open [**Serve layer uses discriminated-union result types for guarded operations**](../../serve/practice-serve-layer-uses-discriminated-union-result-types-not-custom-error-classes.md) — Archive, config-write, and self-review operations return typed result unions; route handlers map their variants to HTTP responses.
### #sanitization
- Open [**markdown.ts is the only sanitizer, and mermaid ignores document overrides**](practice-spa-markdown-and-mermaid-are-the-only-render-boundaries.md) — Only render/markdown.ts parses and sanitizes markdown. mermaid.ts loads the library lazily and blocks directive overrides via MERMAID_SECURE_KEYS.
- Open [**markdown.ts needs a private DOMPurify instance or mermaid loses every SVG attribute**](practice-markdown-policy-needs-its-own-dompurify-instance.md) — markdown.ts registers its sanitize hooks on a private DOMPurify instance; on the shared default they also apply to mermaid's strict-mode SVG pass and blank the Graph tab.
### #security
- Open [**Strikethroo profile packages tolerate inert package-root extras**](../../practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md) — validateProfilePackage scopes to profile.yaml plus config/; entries at the package root are accepted and are never copied, hash-tracked, or executed.
- Open [**How init --profile resolves, validates, and stages a strikethroo profile**](../../cli/map-init-profile-resolves-validates-and-stages-a-strikethroo-profile.md) — src/profiles.ts: fixed source resolution order, all-or-nothing link-refusing validation, overlay staging fed to copyCommonTemplates.
- Open [**export profile copies workspace config verbatim without redaction**](../../cli/map-export-profile-copies-workspace-config-verbatim-without-redaction.md) — exportProfile copies config/ minus schemas/, validates its own output, and warns that config.yaml and cli_args ship as-is.
### #architecture
- Open [**Cross-harness code abstraction centralized in ~54 lines across 3 locations**](../../skills/map-cross-harness-code-abstraction-centralized-in-54-lines-across-3-locations.md) — All harness-specific logic lives in src/types.ts (union type), src/utils.ts (VALID_HARNESSES + getAgentFormat), and src/index.ts (createHarnessStructure). Skills are harness-agnostic.
- Open [**CLI exposes five thin commands and no plan-management surface**](../../skills/map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed.md) — src/cli.ts registers init, update, export profile, serve, and validate; there are no visualization/management (status, plan) commands.
- Open [**Serve layer uses discriminated-union result types for guarded operations**](../../serve/practice-serve-layer-uses-discriminated-union-result-types-not-custom-error-classes.md) — Archive, config-write, and self-review operations return typed result unions; route handlers map their variants to HTTP responses.
### #csp
- Open [**The SPA's CSP is a response header with script-src 'self' and no hash**](practice-spa-csp-is-a-response-header.md) — CONTENT_SECURITY_POLICY in server.ts is sent as a header because frame-ancestors works only there. Inline scripts would break script-src 'self'.
### #gotcha
- Open [**validate's strict pass keeps its own frontmatter reader**](../../cli/practice-validate-strict-pass-keeps-its-own-frontmatter-reader.md) — strict-pass.ts must tell a missing field from a malformed one; the lenient viewer reader and shared plan scan cannot, so never merge them.
- Open [**Use resolveWorkspaceRoot, not findStrikethrooRoot, outside skill bundles**](../../skills/practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md) — findStrikethrooRoot calls process.exit(1) on schema-version skew; resolveWorkspaceRoot returns a typed result and never exits.
- Open [**Add every new test file to the manual include list in vitest.config.ts**](../../testing/practice-add-every-new-test-file-to-the-manual-include-list-in-vitest-config-ts.md) — vitest.config.ts enumerates test files explicitly rather than by glob, so an unlisted new test file is never collected and silently never runs.
### #reuse
- Open [**Reuse shared SPA prose-rendering components across all markdown-rendering screens**](practice-reuse-shared-spa-prose-rendering-components-across-all-markdown-rendering-screens.md) — The project has a standing code-reuse mandate: all markdown-rendering screens must use the shared Section/ReaderProse renderer.
### #serve
- Open [**Hot-reload dev loop requires three concurrent processes**](../../dev/practice-hot-reload-dev-loop-requires-three-concurrent-processes.md) — Backend: ts-node via node --watch. Frontend: Vite at localhost:5173 with /api/* proxied to localhost:4317. No dist/ involvement.
- Open [**npm run dev:serve — ts-node backend hot-reload script**](../../dev/map-npm-run-dev-serve-ts-node-backend-hot-reload-script.md) — Runs src/cli.ts serve via ts-node with node --watch; restarts on src/ changes; no dist/ involvement.
- Open [**Start or reuse a dev:serve instance to visually debug the SPA**](../../dev/practice-start-or-reuse-dev-serve-instance-to-visually-debug-the-spa.md) — To see/screenshot the SPA, reuse or start dev:serve on :4317; rebuild dist-web for source changes, or use dev:web HMR at :5173.
### #theme
- Open [**The SPA's CSP is a response header with script-src 'self' and no hash**](practice-spa-csp-is-a-response-header.md) — CONTENT_SECURITY_POLICY in server.ts is sent as a header because frame-ancestors works only there. Inline scripts would break script-src 'self'.
- Open [**theme-guard.js duplicates theme.ts, so the two must change together**](../styling/practice-theme-guard-must-mirror-theme-ts.md) — theme.ts owns the tri-state preference and storage key. theme-guard.js repeats both before paint. ThemeProvider follows the OS only for system.