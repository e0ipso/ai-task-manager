# kenkeep Index: web

↑ Parent: [kenkeep](../index.md)

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
- Load [`branding/`](branding/index.md) for more information on the strikethroo brand favicon and the font-glyph-extraction technique behind it.
- Load [`editor/`](editor/index.md) for more information on the code-split CodeMirror 6 markdown editor in the Customize detail route and its lazy-loading constraints.
- Load [`rendering/`](rendering/index.md) for more information on SPA markdown and mermaid rendering — the shared sanitization boundary, prose-component reuse, and render-error handling.
- Load [`styling/`](styling/index.md) for more information on SPA styling — Tailwind v4 utilities, the @theme token layer, dark mode, and the vendored dalia CSS foundation.
- Load [`ui/`](ui/index.md) for more information on SPA interactive UI components and read-only affordance conventions.

## Conventions (how we build)
- Open [**SPA data layer: one plans fetch, data kept on failed re-reads, safe routing**](practice-spa-data-layer-shared-plans-resource-and-revalidation.md) to learn about: PlansProvider owns the one /api/plans fetch; useResource keeps last good data on a failed re-read; an SSE reconnect forces one pass. #web #spa #data #revalidation #sse #router

## Components (what exists)
_None yet._

## By topic

### #data
- Open [**SPA data layer: one plans fetch, data kept on failed re-reads, safe routing**](practice-spa-data-layer-shared-plans-resource-and-revalidation.md) — PlansProvider owns the one /api/plans fetch; useResource keeps last good data on a failed re-read; an SSE reconnect forces one pass.
### #revalidation
- Open [**Config editors keep draft, saved baseline, and disk as separate values**](editor/practice-config-editors-keep-draft-baseline-and-disk-apart.md) — draftState.ts stops a live revalidation from replacing typing. A disk change under unsaved edits shows DiskConflictBanner instead.
- Open [**SPA data layer: one plans fetch, data kept on failed re-reads, safe routing**](practice-spa-data-layer-shared-plans-resource-and-revalidation.md) — PlansProvider owns the one /api/plans fetch; useResource keeps last good data on a failed re-read; an SSE reconnect forces one pass.
### #router
- Open [**SPA data layer: one plans fetch, data kept on failed re-reads, safe routing**](practice-spa-data-layer-shared-plans-resource-and-revalidation.md) — PlansProvider owns the one /api/plans fetch; useResource keeps last good data on a failed re-read; an SSE reconnect forces one pass.
### #spa
- Open [**Plan Detail: blueprint markdown section is distinct from the tasks-frontmatter Tasks tab**](../serve/practice-plan-detail-blueprint-markdown-vs-tasks-frontmatter.md) — Four data sources feed the Plan Detail tabs; the blueprint prose and tasks-frontmatter rendering must not be conflated
- Open [**serve UI PRD and tickets live under .ai/strikethroo/scratch/ui/**](../serve/map-serve-ui-prd-and-tickets-live-under-ai-strikethroo-scratch-ui.md) — The PRD and 13 dependency-ordered tickets for the serve SPA feature are in .ai/strikethroo/scratch/ui/, not in the formal plans/ flow.
- Open [**Serve SPA has two sanctioned workspace mutations; self-review writes nothing**](../serve/practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files.md) — Archive moves done plans into archive/. Config writes overwrite one existing allowlisted file. Self-review spawns a process but writes no files.
### #sse
- Open [**window.__stRevalidationCount — Playwright observability hook for SSE-driven revalidation**](../testing/map-window-strevalidationcount-playwright-observability-hook-for-sse-driven-revalidation.md) — Deliberately-shipped window counter that Playwright e2e tests read to verify live-data revalidation fired after an SSE change event.
- Open [**Use domcontentloaded not networkidle when Playwright-driving the SPA**](../capture/practice-use-domcontentloaded-not-networkidle-when-playwright-driving-the-spa.md) — The SPA holds an open SSE connection (/api/events) so networkidle never fires. Use domcontentloaded plus explicit waitForSelector calls instead.
- Open [**SPA data layer: one plans fetch, data kept on failed re-reads, safe routing**](practice-spa-data-layer-shared-plans-resource-and-revalidation.md) — PlansProvider owns the one /api/plans fetch; useResource keeps last good data on a failed re-read; an SSE reconnect forces one pass.
### #web
- Open [**Plan Detail: blueprint markdown section is distinct from the tasks-frontmatter Tasks tab**](../serve/practice-plan-detail-blueprint-markdown-vs-tasks-frontmatter.md) — Four data sources feed the Plan Detail tabs; the blueprint prose and tasks-frontmatter rendering must not be conflated
- Open [**serve UI PRD and tickets live under .ai/strikethroo/scratch/ui/**](../serve/map-serve-ui-prd-and-tickets-live-under-ai-strikethroo-scratch-ui.md) — The PRD and 13 dependency-ordered tickets for the serve SPA feature are in .ai/strikethroo/scratch/ui/, not in the formal plans/ flow.
- Open [**Hot-reload dev loop requires three concurrent processes**](../dev/practice-hot-reload-dev-loop-requires-three-concurrent-processes.md) — Backend: ts-node via node --watch. Frontend: Vite at localhost:5173 with /api/* proxied to localhost:4317. No dist/ involvement.