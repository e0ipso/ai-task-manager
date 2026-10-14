---
type: map
title: Auth probe deadline and the single executable resolver
description: >-
  prepareLaunch bounds only the auth probe with a compiled constant.
  resolveExecutablePath is the one resolver; self-review.ts keeps its own scan.
tags:
  - dispatch
  - harness
  - executable-resolution
  - readiness
  - windows
kk_schema_version: 3
kk_id: map-auth-probe-deadline-and-the-single-executable-resolver
kk_derived_from: []
kk_relates_to:
  - map-model-optional-dispatch-reviewer-harness-omits-model
  - practice-harness-cli-args-are-exact-local-strings-and-executable-authority
  - practice-task-routing-classifies-at-generation-and-selects-at-dispatch
kk_depends_on: []
kk_confidence: high
---
Before each external task or review launch, `prepareLaunch` in `src/skill-scripts/shared/external-dispatch.ts` resolves the executable and runs the adapter's authentication command under `AUTHENTICATION_TIMEOUT_MS`. When the deadline passes, the child gets `SIGKILL`. That reaches the child process only, not a process group. The diagnostic tells a timeout, a non-zero exit, and a launch failure apart. The deadline is a compiled constant, not a `config.yaml` key, so a local value cannot make it unbounded. It bounds this probe only. Task and review dispatch have no deadline.

`resolveExecutablePath` and its predicate `executableResolves` in `src/skill-scripts/shared/executable-resolution.ts` are the one resolver for dispatch, the availability cache identity, and the review gate's `xmllint` probe. A reference with a path separator is tested as given. A bare name is searched on `PATH`. The result is the `realpath`, so reaching an executable through a link does not change the cache key. Changing the configuration, argument order, executable path, or probe contract misses the old cache entry.

`src/serve/self-review.ts` keeps its own presence-only `PATH` scan on purpose. It only reports whether the `self-review` binary is on `PATH` and never executes it.

The win32 branch adds `PATHEXT` suffixes and checks `F_OK` instead of `X_OK`. Tests cover it only through an injected platform fixture on a POSIX host. Finding an executable there does not prove that a `.cmd` shim launches.

<!-- kk:related:start -->
# Related

- Related: [map-model-optional-dispatch-reviewer-harness-omits-model](../code-review/map-model-optional-dispatch-reviewer-harness-omits-model.md)
- Related: [practice-harness-cli-args-are-exact-local-strings-and-executable-authority](practice-harness-cli-args-are-exact-local-strings-and-executable-authority.md)
- Related: [practice-task-routing-classifies-at-generation-and-selects-at-dispatch](practice-task-routing-classifies-at-generation-and-selects-at-dispatch.md)
<!-- kk:related:end -->
