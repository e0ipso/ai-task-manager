---
type: map
title: 'workspace-model.ts has three reads, and serve/root.ts accepts bare workspaces'
description: >-
  getPlanSummaries, getPlanDetail, and getConfig share toSummary.
  resolveWorkspaceRoot tries a project dir, then a bare workspace dir like the
  fixtures.
tags:
  - serve
  - workspace-model
  - root
  - fixtures
  - api
kk_schema_version: 3
kk_id: map-serve-workspace-model-reads-and-root-resolution
kk_derived_from: []
kk_relates_to:
  - >-
    practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles
  - map-src-tests-fixtures-serve-workspace-committed-fixture-workspace-for-tests
  - >-
    map-capture-fixture-workspace-plans-102-104-as-active-demo-plans-for-screen-capture
kk_depends_on: []
kk_confidence: high
---
`src/serve/workspace-model.ts` is the synchronous, read-only data layer behind the JSON API. It has three reads:

- `getPlanSummaries` backs `/api/plans`. It reads plan and task frontmatter plus the phase count from the shared blueprint parser. It reads no sections, mermaid, or `config/`, so the list stays cheap.
- `getPlanDetail` returns one plan with derived state, tasks, phases, sections, and mermaid blocks.
- `getConfig` returns the `config/` hooks, templates, and `config.yaml`.

Both plan reads build their summary fields through the private `toSummary`. Keep it that way. A field added to one read and not the other makes the list and the detail page disagree.

`resolveWorkspaceRoot` in `src/serve/root.ts`, shared by `serve` and `validate`, returns the `.ai/strikethroo` directory or an `{ error }`. Given `--workspace <path>`, it first tries the path as a project directory, then as the workspace directory itself. Project semantics come first so every path that resolved before keeps its meaning. The direct form exists for the committed fixtures `src/__tests__/fixtures/serve-workspace` and `src/capture/fixtures/capture-workspace`, which hold `.init-metadata.json` at their top level with no `.ai/` above them.

`root.ts` imports nothing from `src/skill-scripts/`. The module comment explains why. `tsconfig.json`'s `exclude` filters root files, not the module graph, so any import from that subtree is still compiled into `dist/`. Keeping the resolver self-contained holds that line.

<!-- kk:related:start -->
# Related

- Related: [practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles](../skills/practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md)
- Related: [map-src-tests-fixtures-serve-workspace-committed-fixture-workspace-for-tests](../testing/map-src-tests-fixtures-serve-workspace-committed-fixture-workspace-for-tests.md)
- Related: [map-capture-fixture-workspace-plans-102-104-as-active-demo-plans-for-screen-capture](../capture/map-capture-fixture-workspace-plans-102-104-as-active-demo-plans-for-screen-capture.md)
<!-- kk:related:end -->
