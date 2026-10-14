---
type: practice
title: The reviewer prints findings; only the orchestrator writes review.xml
description: >-
  Stdout between per-dispatch token delimiters is the one findings channel.
  Anti-echo guard, stale-file removal, and no certification on nonzero exit.
tags:
  - review-gate
  - delivery
  - stdout
  - certification
kk_schema_version: 3
kk_id: practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them
kk_derived_from: []
kk_relates_to:
  - practice-review-gate-reports-it-does-not-fix
  - map-model-optional-dispatch-reviewer-harness-omits-model
  - practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore
kk_depends_on: []
kk_confidence: high
---
The reviewer never writes the findings file. Its prompt, from `buildReviewerPrompt` in `src/skill-scripts/code-review.ts`, tells it to print the whole document between two marker lines that carry a per-dispatch token from `_makeDeliveryToken`, and names no write target. `_extractReviewDocument` pulls the last qualifying region out of captured stdout, and the orchestrator's own process writes it to `<plan-dir>/review/review.xml`. Every supported harness can write to stdout, so this needs no reviewer-only sandbox flag or per-harness argument case.

**Anti-echo guard.** The extractor rejects a region whose content does not start with `<?xml` or `<review`. The prompt contains the markers itself, so the placeholder between them is plain prose. A reviewer that echoes its instructions then produces a region the guard rejects, not a document. Keep that placeholder prose.

**No stale document.** `runReview` deletes `review.xml` and `reviewer-output.txt` before dispatch, so a file from an earlier run can never be certified.

**Nothing degrades into clean.** A reviewer that exits nonzero is never certified, even if its output held a valid document. No qualifying region gives `findings-absent`. A reviewer that could not read the repository stays uncertified. The delivered XML always goes through `validateAgainstSchema`, never straight to `parseReviewFindings`.

**Capture is review-only.** `dispatchReview` in `src/skill-scripts/shared/external-dispatch.ts` is the only caller that requests stdout capture. It tees each chunk to stderr so the operator still sees progress, and keeps a bounded tail, `CAPTURED_STDOUT_LIMIT`, trimmed from the front because the document comes last. Task dispatch output stays inherited. A run that does not certify writes the transcript to `review/reviewer-output.txt` as a best-effort diagnostic that never changes the verdict.

<!-- kk:related:start -->
# Related

- Related: [practice-review-gate-reports-it-does-not-fix](practice-review-gate-reports-it-does-not-fix.md)
- Related: [map-model-optional-dispatch-reviewer-harness-omits-model](map-model-optional-dispatch-reviewer-harness-omits-model.md)
- Related: [practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore](../practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md)
<!-- kk:related:end -->
