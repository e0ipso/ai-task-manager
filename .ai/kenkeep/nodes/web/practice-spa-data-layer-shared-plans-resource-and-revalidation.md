---
type: practice
title: 'SPA data layer: one plans fetch, data kept on failed re-reads, safe routing'
description: >-
  PlansProvider owns the one /api/plans fetch; useResource keeps last good data
  on a failed re-read; an SSE reconnect forces one pass.
tags:
  - web
  - spa
  - data
  - revalidation
  - sse
  - router
kk_schema_version: 3
kk_id: practice-spa-data-layer-shared-plans-resource-and-revalidation
kk_derived_from: []
kk_relates_to:
  - >-
    practice-web-routes-and-api-resolve-plans-by-composite-id-slug-directory-name-not-numeric
  - practice-serve-self-review-and-sse-are-bounded-not-managed
kk_depends_on: []
kk_confidence: high
---
Screens read the API only through hooks in `src/web/data/api.ts`. They never fetch directly and never carry mock data.

**One plans request.** Several components need the plan list at once, such as the Sidebar's archive count and the routed screen. `PlansProvider`, mounted in `App.tsx` inside the revalidation provider, owns the single `/api/plans` resource, and `usePlans` reads it from context. That gives one request per load and one per revalidation pass. It is not a cache. Nothing outlives the provider, and the revalidation token is still the only refresh trigger. Outside a provider, as in the `?gallery=1` harness, `usePlans` falls back to its own fetch.

**Failed re-reads keep data.** `useResource` keeps its last good data when a revalidation fails and attaches `error` beside it. Only the initial load moves to the `error` state. This is what lets a mounted editor survive a transient read failure.

**Reconnect replays.** When the SSE stream reopens after a drop, `src/web/data/revalidation.tsx` runs one immediate pass. A change written while the stream was down never arrives as `changed`, so without that pass the screen would stay stale.

**Paths are encoded once and decoded once.** Callers of `navigate` percent-encode every segment they interpolate. `parsePath` in `router.tsx` decodes each captured segment once. A malformed sequence yields the raw segment, which matches nothing and renders the not-found screen. It must never throw, because `parsePath` runs in a `useState` initializer and on `popstate`, where a throw blanks the app.

<!-- kk:related:start -->
# Related

- Related: [practice-web-routes-and-api-resolve-plans-by-composite-id-slug-directory-name-not-numeric](../serve/practice-web-routes-and-api-resolve-plans-by-composite-id-slug-directory-name-not-numeric.md)
- Related: [practice-serve-self-review-and-sse-are-bounded-not-managed](../serve/practice-serve-self-review-and-sse-are-bounded-not-managed.md)
<!-- kk:related:end -->
