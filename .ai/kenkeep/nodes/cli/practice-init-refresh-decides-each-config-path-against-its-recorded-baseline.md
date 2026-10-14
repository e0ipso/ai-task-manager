---
type: practice
title: Init refresh decides each config path against its recorded baseline
description: >-
  One outcome per config/ path, kept edits keep the old baseline, no trusted
  metadata means {} and every differing file conflicts.
tags:
  - init
  - update
  - refresh
  - conflicts
  - metadata
kk_schema_version: 3
kk_id: practice-init-refresh-decides-each-config-path-against-its-recorded-baseline
kk_derived_from: []
kk_relates_to:
  - practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only
  - map-update-refreshes-the-workspace-then-runs-npx-skills-update
  - practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore
kk_depends_on: []
kk_confidence: high
---
`copyCommonTemplates` in `src/index.ts` gives every incoming `config/` path one outcome: `installed`, `unchanged`, `refreshed`, `overwritten`, or `kept`. The question for each path is whether the user changed it, so `detectConflicts` in `src/conflict-detector.ts` compares the destination with its recorded baseline, not with the incoming file. A destination byte-identical to the incoming file is never a conflict, tracked or not. A conflict on one path never stops another path from refreshing.

A kept path records its previous baseline, or nothing when it had none. Never record the kept file's own hash. That would make the user's edit the baseline, the next refresh would see no divergence, and it would overwrite the edit without asking. So a kept path is asked about again on every refresh while it differs from the incoming file. A recorded path the incoming tree no longer ships stays recorded, so `validate` can still report its deletion.

Metadata that `loadMetadata` returns as null, because it is absent, unparsable, or has no `files` map, is not treated as a first install. The baseline becomes `{}`, and every existing destination that differs from its incoming file conflicts with `originalHash` set to `NO_RECORDED_BASELINE`. The prompt then calls the file untracked rather than modified.

When stdin is not a TTY, `promptForConflicts` in `src/prompts.ts` throws before rendering anything and lists every conflicting path. `--force` is the only non-interactive route. Metadata is written last, so a failed copy leaves the previous baselines in place. Files outside `config/`, including the workspace `.gitignore`, have no baseline and are overwritten on every run.

<!-- kk:related:start -->
# Related

- Related: [practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only](practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only.md)
- Related: [map-update-refreshes-the-workspace-then-runs-npx-skills-update](map-update-refreshes-the-workspace-then-runs-npx-skills-update.md)
- Related: [practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore](../practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md)
<!-- kk:related:end -->
