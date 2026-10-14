---
type: practice
title: 'Config editors keep draft, saved baseline, and disk as separate values'
description: >-
  draftState.ts stops a live revalidation from replacing typing. A disk change
  under unsaved edits shows DiskConflictBanner instead.
tags:
  - web
  - customize
  - editor
  - revalidation
  - conflicts
kk_schema_version: 3
kk_id: practice-config-editors-keep-draft-baseline-and-disk-apart
kk_derived_from: []
kk_relates_to:
  - practice-spa-data-layer-shared-plans-resource-and-revalidation
  - practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa
  - >-
    map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r
kk_depends_on: []
kk_confidence: high
---
Both Customize editors, the Markdown editor in `CustomizeDetailRoute.tsx` and the Config form in `WorkspaceConfigTab.tsx`, drive their state through the pure transitions in `src/web/customize/draftState.ts`. Each file has three values. `draft` is what the user edits. `baseline` is the content last known to be saved. `disk` is the content most recently read from the server.

Only a keystroke, an explicit load of the disk version, or switching to another file may replace the draft. A live revalidation only updates `disk`, so it can never overwrite typing. When disk changes beneath unsaved edits, the editor shows `DiskConflictBanner`. The user either loads the disk version with `loadDisk` or keeps editing with `acknowledgeDisk`.

A save in flight is the subtle case. While a save is pending, a disk observation is recorded but not adopted. The save's own write can arrive before its response, and adopting it would drop whatever the user typed in between. `commitSave` keeps a disk change seen during the save unless it is the exact snapshot that was submitted, because it may be another writer's.

Content is compared through a key: raw text for Markdown, serialized YAML for the form. A reparse that serializes identically is not a change. Do not set editor state directly from a resource read. Go through these transitions.

<!-- kk:related:start -->
# Related

- Related: [practice-spa-data-layer-shared-plans-resource-and-revalidation](../practice-spa-data-layer-shared-plans-resource-and-revalidation.md)
- Related: [practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa](practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa.md)
- Related: [map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r](map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r.md)
<!-- kk:related:end -->
