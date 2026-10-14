---
type: practice
title: 'Customize editors keep draft, baseline, and disk apart'
description: >-
  configYaml.ts is the only YAML boundary; draftState.ts stops revalidation from
  overwriting typing.
tags:
  - customize
  - config-yaml
kk_schema_version: 3
kk_id: practice-config-editors-keep-draft-baseline-and-disk-apart
kk_derived_from: []
kk_relates_to:
  - practice-config-yaml-is-local-and-empty-means-unconfigured
kk_depends_on: []
kk_confidence: high
---
`configYaml.ts` is the SPA's only YAML boundary. A save keeps foreign top-level sections but drops comments. It is refused when an owned section has a shape the form cannot represent.

`draftState.ts` keeps the draft, the saved baseline, and the last disk content apart, so revalidation never overwrites typing. Only `DiskConflictBanner` replaces a draft.

<!-- kk:related:start -->
# Related

- Related: [practice-config-yaml-is-local-and-empty-means-unconfigured](../../skills/practice-config-yaml-is-local-and-empty-means-unconfigured.md)
<!-- kk:related:end -->
