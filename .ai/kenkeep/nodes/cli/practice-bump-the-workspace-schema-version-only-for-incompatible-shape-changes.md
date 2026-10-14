---
type: practice
title: Bump the workspace schema version only for incompatible shape changes
description: >-
  CURRENT_WORKSPACE_SCHEMA_VERSION is baked into skill bundles and compared in
  root.ts; root.ts also hard-codes a test fallback.
tags:
  - schema-version
  - metadata
  - skills
  - build
  - compatibility
kk_schema_version: 3
kk_id: practice-bump-the-workspace-schema-version-only-for-incompatible-shape-changes
kk_derived_from: []
kk_relates_to:
  - practice-optional-by-absence-new-files-absent-means-feature-off
  - >-
    practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles
  - practice-init-refresh-decides-each-config-path-against-its-recorded-baseline
kk_depends_on: []
kk_confidence: high
---
`CURRENT_WORKSPACE_SCHEMA_VERSION` in `src/metadata.ts` is the workspace schema version. `init` writes it to `workspaceSchemaVersion` in `.init-metadata.json`, separate from the CLI `version` string. `scripts/build-skills.cjs` reads it from `dist/metadata.js`, so `tsc` must run first, and bakes it into every skill bundle as `EXPECTED_WORKSPACE_SCHEMA_VERSION` through esbuild `define`. The build fails if that identifier survives in any bundle.

`checkWorkspaceSchema` in `src/skill-scripts/shared/root.ts` compares the two and exits on skew. An older workspace gets told to re-run `npx strikethroo init` with the latest CLI. A workspace newer than the skill gets told to re-run `npx skills add e0ipso/strikethroo`. Metadata without the field reads as version 1 on both sides, in `loadMetadata` and in `root.ts`, so workspaces from before the field existed still resolve.

`root.ts` also hard-codes `4` as the fallback for unbundled runs under Vitest, where `define` never applies. A bump has to change that literal too, or source-level tests keep checking the old version.

Bump only for an incompatible change to workspace shape: renamed hooks, newly required templates, a different directory layout. Every bump forces users to re-run `init` or `update`, and there is no migrate command. A new optional-by-absence file is not a shape change and leaves the version alone.

<!-- kk:related:start -->
# Related

- Related: [practice-optional-by-absence-new-files-absent-means-feature-off](../code-review/practice-optional-by-absence-new-files-absent-means-feature-off.md)
- Related: [practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles](../skills/practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md)
- Related: [practice-init-refresh-decides-each-config-path-against-its-recorded-baseline](practice-init-refresh-decides-each-config-path-against-its-recorded-baseline.md)
<!-- kk:related:end -->
