---
type: practice
title: 'Customize Config tab: configYaml.ts is the only YAML boundary'
description: >-
  configYaml.ts parses and writes config.yaml for the form. Saves keep foreign
  sections, drop comments, and refuse shapes the form cannot represent.
tags:
  - web
  - customize
  - config-yaml
  - yaml
  - editor
kk_schema_version: 3
kk_id: practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa
kk_derived_from: []
kk_relates_to:
  - >-
    practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files
  - practice-config-editors-keep-draft-baseline-and-disk-apart
kk_depends_on: []
kk_confidence: high
---
The Config tab in `src/web/customize/WorkspaceConfigTab.tsx` edits `config/config.yaml` through a structured form, not a text editor. `src/web/customize/configYaml.ts` is the only place YAML enters or leaves that form. No component parses or emits YAML itself.

`parseWorkspaceConfig` keeps the full parsed document next to the form model. `serializeWorkspaceConfig` writes the owned sections (`harnesses`, `execution_routing`, `code_review`) back into that document and dumps the whole file. Top-level sections that belong to other features survive a save. Comments do not, because a YAML round-trip cannot keep them. The UI and the shipped template both tell the user so.

If an owned section exists but has a shape the form cannot represent, parsing reports it as unsupported and the tab refuses a form save. A rewrite would destroy content the form never showed. Keep this rule when adding a field: an unknown shape must block the save, not be dropped.

Profile names are user input, so one can be `__proto__`. `serializeWorkspaceConfig` builds the profiles map with `Object.create(null)`. On a plain object literal that key hits the inherited setter, the profile vanishes, and `dump` rejects the object.

Harness `cli_args` values are never trimmed. The loader on the skill side keeps them byte for byte, and the form must match.

<!-- kk:related:start -->
# Related

- Related: [practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files](../../serve/practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files.md)
- Related: [practice-config-editors-keep-draft-baseline-and-disk-apart](practice-config-editors-keep-draft-baseline-and-disk-apart.md)
<!-- kk:related:end -->
