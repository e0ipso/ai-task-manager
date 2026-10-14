---
type: practice
title: Bump the workspace schema version only for incompatible shape changes
description: >-
  CURRENT_WORKSPACE_SCHEMA_VERSION is baked into skills and duplicated as a
  fallback in root.ts.
tags:
  - schema-version
  - metadata
kk_schema_version: 3
kk_id: practice-bump-workspace-schema-version-only-for-incompatible-shape
kk_derived_from: []
kk_relates_to:
  - practice-optional-by-absence-new-files-absent-means-feature-off
kk_depends_on: []
kk_confidence: high
---
Bump `CURRENT_WORKSPACE_SCHEMA_VERSION` in `src/metadata.ts` only when the workspace shape changes incompatibly, such as a new required file. Skills bake it at build time as `EXPECTED_WORKSPACE_SCHEMA_VERSION`. `src/skill-scripts/shared/root.ts` also hard-codes it as the fallback for unbundled test runs, so update both. A new file that is optional by absence needs no bump.

<!-- kk:related:start -->
# Related

- Related: [practice-optional-by-absence-new-files-absent-means-feature-off](../code-review/practice-optional-by-absence-new-files-absent-means-feature-off.md)
<!-- kk:related:end -->
