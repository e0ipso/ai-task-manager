---
type: practice
title: Route workspace file access through safe-fs
description: >-
  serve, the CLI, and skill bundles share safe-fs.ts for link-refusing reads and
  atomic writes.
tags:
  - safe-fs
  - security
kk_schema_version: 3
kk_id: practice-route-workspace-file-access-through-safe-fs
kk_derived_from: []
kk_relates_to:
  - practice-serve-request-security-model
kk_depends_on: []
kk_confidence: high
---
Workspace reads and writes in `serve`, the CLI, and the skill bundles go through `src/skill-scripts/shared/safe-fs.ts`. It refuses symlinks and non-regular files and writes atomically. Do not add raw `fs` access to workspace paths. It defends against links planted beforehand, not against a concurrent path swap.
