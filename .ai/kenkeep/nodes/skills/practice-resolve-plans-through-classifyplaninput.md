---
type: practice
title: Resolve plan arguments through _classifyPlanInput and resolvePlan
description: >-
  shared/plan-resolve.ts classifies input once: absolute path or plan id. Ids
  stay in the nearest workspace; both routes pass checkWorkspaceSchema.
tags:
  - skill-scripts
  - plan-resolution
  - workspace-root
  - schema-version
kk_schema_version: 3
kk_id: practice-resolve-plans-through-classifyplaninput
kk_derived_from: []
kk_relates_to:
  - >-
    practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles
  - >-
    map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root
kk_depends_on: []
kk_confidence: high
---
`resolvePlan` in `src/skill-scripts/shared/plan-resolve.ts` classifies its argument once, with `_classifyPlanInput`. An input that is absolute under the host's `path.isAbsolute` addresses one plan file. Any other input that `parseInt` reads as an integer is a plan id. Everything else, including a relative path, is invalid.

A plan id resolves only in the nearest workspace that `findStrikethrooRoot` finds. An id missing from that workspace is not found, even if another workspace above or beside it holds the plan. An absolute path is the deliberate route to a plan in another workspace.

Both routes pass `checkWorkspaceSchema` in `shared/root.ts`, the single schema gate, which ends the process on version skew. The path route has a layout shortcut for `.ai/strikethroo/{plans,archive}/<plan>/`, and that shortcut still calls the same gate. So the verdict and its message do not depend on how the caller addressed the workspace.

An entrypoint that rejects bad input early calls `_classifyPlanInput` and checks for `invalid`, as `validate-plan-blueprint.ts` does. Do not add a separate absolute-path test in an entrypoint.

The Windows rule is tested by passing a different `isAbsolute` predicate on a POSIX host, not by running on Windows.

<!-- kk:related:start -->
# Related

- Related: [practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles](practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md)
- Related: [map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root](map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root.md)
<!-- kk:related:end -->
