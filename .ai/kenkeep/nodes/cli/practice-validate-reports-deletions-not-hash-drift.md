---
type: practice
title: 'validate reports deleted files, never hash drift'
description: >-
  validateWorkspace avoids findStrikethrooRoot, treats edits as customization,
  and keeps its own strict reader.
tags:
  - validate
  - frontmatter
kk_schema_version: 3
kk_id: practice-validate-reports-deletions-not-hash-drift
kk_derived_from: []
kk_relates_to:
  - practice-optional-by-absence-new-files-absent-means-feature-off
  - practice-init-refresh-kept-file-keeps-its-old-baseline
kk_depends_on: []
kk_confidence: high
---
`validateWorkspace` in `src/validation/` takes a resolved root and never calls `findStrikethrooRoot`, which exits on schema skew, the case `validate` exists to report.

A hash mismatch against `.init-metadata.json` is user customization, not a finding. Only deleted files are, minus `OPTIONAL_BY_ABSENCE`.

`strict-pass.ts` keeps its own frontmatter reader because the viewer's lenient one cannot tell a missing field from a malformed one. Do not merge them. The task status list is copied in `TASK_STATUSES` (`shared/task-file.ts`), `strict-pass.ts` and the `TASK_TEMPLATE.md` comment. Change all three together.
