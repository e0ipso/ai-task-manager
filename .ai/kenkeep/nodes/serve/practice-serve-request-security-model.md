---
type: practice
title: 'Serve guards every request before routing, and mutations need a session token'
description: >-
  guardRequest checks Host, origin, and method first. Mutations need the
  per-start capability from GET /api/session. Scripts must fetch it too.
tags:
  - serve
  - security
  - dns-rebinding
  - capability
  - origin
  - http
kk_schema_version: 3
kk_id: practice-serve-request-security-model
kk_derived_from: []
kk_relates_to:
  - >-
    practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files
  - map-src-serve-self-review-ts-post-api-self-review-endpoint
kk_depends_on: []
kk_confidence: high
---
`serve` is a single-user tool. Every request, static or API, passes through `guardRequest` in `src/serve/server.ts` before any route runs. The rules below are compiled. Do not loosen them for convenience.

- It binds loopback by default. `--host` accepts IP literals only, checked with `net.isIP` in `src/cli.ts`, because a hostname is open to DNS rebinding and an IP literal is not.
- The `Host` header must name an allowed authority. That means loopback, or an address `hostAddressesFor` read at startup for the bound interface. Anything else gets `421`. This is the DNS-rebinding defense.
- Routes match by path first, then method. A wrong method on a known route gets `405`, so a mutation path never reaches a read handler.
- `startServer` mints one random token per start. Only `GET /api/session` returns it. Each mutation must send it in `CAPABILITY_HEADER`, or it gets `403` before any body read, file access, or process launch.
- `GET /api/session` and every mutation reject a cross-site `Sec-Fetch-Site` or a foreign `Origin`. The server never sends an `Access-Control-Allow-*` header, so a page on another origin cannot read the token.

The capability stops a browser page on another origin and DNS rebinding. It does not isolate `serve` from other local processes. Anything running as the same user can bootstrap a token, and with a `--host` network bind so can every peer that reaches the port. Treat a network bind as trusting that network.

Any script that calls a mutation route has to do what the SPA in `src/web/data/api.ts` does. Fetch `GET /api/session`, then send the header. The SPA keeps the token in memory and re-bootstraps once on a `403`.

`npm run dev:web` proxies `/api` and strips `Origin` in `vite.config.mts`, because the browser's Origin is the Vite dev origin. That applies to the dev server only. The capability is still required.

<!-- kk:related:start -->
# Related

- Related: [practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files](practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files.md)
- Related: [map-src-serve-self-review-ts-post-api-self-review-endpoint](map-src-serve-self-review-ts-post-api-self-review-endpoint.md)
<!-- kk:related:end -->
