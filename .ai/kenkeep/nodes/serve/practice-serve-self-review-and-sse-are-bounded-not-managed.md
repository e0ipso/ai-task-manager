---
type: practice
title: 'Self-review launches and SSE streams are bounded, not managed'
description: >-
  self-review.ts caps concurrent launches per plan and overall in memory;
  events.ts caps SSE clients and drops blocked ones. Neither is a job manager.
tags:
  - serve
  - self-review
  - sse
  - limits
  - backpressure
kk_schema_version: 3
kk_id: practice-serve-self-review-and-sse-are-bounded-not-managed
kk_derived_from: []
kk_relates_to:
  - map-src-serve-self-review-ts-post-api-self-review-endpoint
  - practice-serve-request-security-model
kk_depends_on: []
kk_confidence: high
---
`src/serve/self-review.ts` keeps an in-memory registry keyed by canonical plan path. A second launch for a plan whose reviewer is still running gets `409`. A launch past `MAX_CONCURRENT_SELF_REVIEWS` gets `429` with `Retry-After`. The endpoint reports success only after the child's `spawn` event, and frees the slot on `exit`, `error`, or launch failure.

The accounting is per server instance. A restart resets it, and the detached reviewer children can outlive the server. Treat the registry as a bound on concurrent launches. It does not track jobs, and nothing should start relying on it as if it did.

`src/serve/events.ts` admits at most `MAX_SSE_CLIENTS` streams and answers an extra connection with `503` and `Retry-After`. When a client's socket reports backpressure, the server stops writing to it and owes it one `changed` on `drain`. A client still blocked after `BLOCKED_TIMEOUT_MS` is ended and removed. Disconnect and `close()` clear every per-client timer and listener, so a new per-client resource needs the same cleanup.

<!-- kk:related:start -->
# Related

- Related: [map-src-serve-self-review-ts-post-api-self-review-endpoint](map-src-serve-self-review-ts-post-api-self-review-endpoint.md)
- Related: [practice-serve-request-security-model](practice-serve-request-security-model.md)
<!-- kk:related:end -->
