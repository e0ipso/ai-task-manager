---
type: practice
title: Release workflow splits verify from publish
description: >-
  Tests run read-only with no secrets; publishing uses npm trusted publishing.
  Actions are SHA-pinned.
tags:
  - release
  - ci
kk_schema_version: 3
kk_id: practice-release-workflow-splits-verify-from-publish
kk_derived_from: []
kk_relates_to:
  - practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime
kk_depends_on: []
kk_confidence: high
---
`release.yml` runs tests in a read-only `verify` job with no secrets. The `release` job publishes with `id-token: write` for npm trusted publishing, so there is no `NPM_TOKEN`, and installs with `npm ci --ignore-scripts`.

Pin every action to a full commit SHA and declare least-privilege permissions. `src/__tests__/ci-workflows.test.ts` enforces both.
