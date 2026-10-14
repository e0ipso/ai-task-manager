---
type: practice
title: The review gate runs only when code_review.enabled is boolean true
description: >-
  Absent, false, or missing config skips as review-disabled before any schema,
  hook, validator, or discovery work. Invalid config fails.
tags:
  - review-gate
  - opt-in
  - configuration
  - activation
kk_schema_version: 3
kk_id: practice-review-gate-runs-only-on-explicit-boolean-opt-in
kk_derived_from: []
kk_relates_to:
  - practice-optional-by-absence-new-files-absent-means-feature-off
  - practice-review-gate-reports-it-does-not-fix
  - >-
    practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles
kk_depends_on: []
kk_confidence: high
---
Review is off by default. `loadCodeReviewConfiguration` in `src/skill-scripts/shared/code-review-configuration.ts` reads only the `code_review` section of local `config/config.yaml` and enables the gate only for `enabled: true`. A missing file, blank file, missing section, or missing key all mean disabled. A non-boolean value or an unknown key in the section is an infrastructure failure, not a silent off. The shipped template sets `enabled: false`.

The disabled check comes first in `resolveReviewContext` in `src/skill-scripts/code-review.ts`. It finds the workspace with `discoverStrikethrooRoot`, which skips the schema check, then reads the opt-in, and only on the enabled path calls `checkWorkspaceSchema`. Do not swap in `findStrikethrooRoot` there. It exits the process on schema skew, so a workspace that never opted in would fail a gate it never asked for. Hook, XSD, `xmllint`, discovery, diff, and dispatch all come after the opt-in.

Two ways to turn review off behave differently across a refresh. An empty `CODE_REVIEW.md` stays empty and keeps an opted-in review suppressed. A deleted one comes back, because `init` and `update` restore missing shipped files. `config.yaml` is hash-tracked like other `config/` paths, so a user-edited true or false is kept unless they answer overwrite or pass `--force`, which installs the shipped false.

**Summary label is presentation only.** The result's `codeReview` string reads Pass for a certified review with no findings, Address for certified findings, Skipped only for `review-disabled`, and Failed for everything else, including the other skip reasons. `_classify` alone sets `action` and the exit code, so the label never changes either. The execution prompts copy `codeReview` verbatim and follow `action`. They never re-derive whether review was allowed.

<!-- kk:related:start -->
# Related

- Related: [practice-optional-by-absence-new-files-absent-means-feature-off](practice-optional-by-absence-new-files-absent-means-feature-off.md)
- Related: [practice-review-gate-reports-it-does-not-fix](practice-review-gate-reports-it-does-not-fix.md)
- Related: [practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles](../skills/practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md)
<!-- kk:related:end -->
