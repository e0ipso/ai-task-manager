---
type: practice
title: 'An empty config.yaml means nothing is configured, in every reader'
description: >-
  Absent, blank, or comment-only config.yaml is unconfigured everywhere via
  hasYamlContent. The SPA mirrors it. Malformed YAML is an error.
tags:
  - config-yaml
  - execution-routing
  - harness
  - customize
  - gotcha
kk_schema_version: 3
kk_id: practice-empty-config-yaml-means-nothing-configured-in-every-reader
kk_derived_from: []
kk_relates_to:
  - practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace
kk_depends_on: []
kk_confidence: high
---
`config/config.yaml` is local to each machine because harness permissions, installed models, and routing choices differ per developer. The tracking policy and the `git rm --cached` caveat live in the related workspace-tracking node.

An absent, blank, or comment-only file means nothing is configured. Every reader treats it the same way. `loadHarnessConfiguration` returns empty arguments, `loadRoutingConfig` reports routing off, `loadCodeReviewConfiguration` reports review disabled, and the Customize Config form parses it to its empty form. The shared test is `hasYamlContent` in `src/skill-scripts/shared/task-frontmatter.ts`.

`parseWorkspaceConfig` in `src/web/customize/configYaml.ts` carries its own copy of that predicate. Vite bundles that module into the SPA, and the SPA cannot import across the `src/skill-scripts/**` build boundary, so the shared function cannot reach it. The two copies must agree. Change them together.

Non-empty YAML that does not parse is an error in each reader. It never degrades to "nothing configured".

<!-- kk:related:start -->
# Related

- Related: [practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace](../practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md)
<!-- kk:related:end -->
