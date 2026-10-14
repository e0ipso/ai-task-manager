---
type: practice
title: 'The skill-scripts build boundary: tsconfig exclude is not an import fence'
description: >-
  tsc still emits any src/skill-scripts/shared module the CLI imports.
  dist/skill-scripts/shared/ is that closure; keep crossings deliberate and few.
tags:
  - skill-scripts
  - build
  - tsconfig
  - esbuild
  - boundary
kk_schema_version: 3
kk_id: practice-skill-scripts-build-boundary-keep-crossings-few
kk_derived_from: []
kk_relates_to:
  - map-phase-derivation-is-implemented-twice-viewer-path-and-execution-path
  - >-
    practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles
kk_depends_on: []
kk_confidence: high
---
Runtime logic for skills is written once in TypeScript under `src/skill-scripts/`, with shared helpers in `src/skill-scripts/shared/`. That subtree type-checks through `tsconfig.skill-scripts.json`. What ships to skills is the esbuild bundle, never `tsc` output.

The root `tsconfig.json` lists `src/skill-scripts/**` under `exclude`, but `exclude` only filters TypeScript's root file set. It does not stop the module graph. Any shared module that the CLI domain imports is still compiled into `dist/`. Today `src/serve/`, `src/validation/`, and `src/metadata.ts` reach six modules: `root`, `plan-scan`, `frontmatter`, `complexity-score`, `blueprint-parse`, and `safe-fs`. `dist/skill-scripts/shared/` holds exactly those. Nothing else from the subtree reaches `dist/`.

`safe-fs` is a deliberate widening, so serve, the CLI, and the skill bundles share one containment and atomic-write implementation. `blueprint-parse` is the single blueprint parser, covered in the linked serve node.

Every new import from `src/serve/`, `src/validation/`, or another CLI module into `src/skill-scripts/shared/` widens what `tsc` emits. Add one only when you mean to. The reverse direction is forbidden. Nothing under `src/skill-scripts/` may import `src/validation/`, because esbuild bundles each entrypoint whole and one edge would put the validator into every skill `.cjs`.

The SPA has the same constraint. `src/web/customize/configYaml.ts` mirrors `hasYamlContent` and the harness argument rules instead of importing them, because Vite bundles it and it must not import across the boundary.

<!-- kk:related:start -->
# Related

- Related: [map-phase-derivation-is-implemented-twice-viewer-path-and-execution-path](../serve/map-phase-derivation-is-implemented-twice-viewer-path-and-execution-path.md)
- Related: [practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles](practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md)
<!-- kk:related:end -->
