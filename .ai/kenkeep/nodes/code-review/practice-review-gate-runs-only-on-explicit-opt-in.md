---
type: practice
title: Review gate runs only on explicit opt-in
description: >-
  code_review.enabled must be boolean true. Anything else skips before any other
  check.
tags:
  - review-gate
  - config-yaml
kk_schema_version: 3
kk_id: practice-review-gate-runs-only-on-explicit-opt-in
kk_derived_from: []
kk_relates_to:
  - practice-review-gate-reports-it-does-not-fix
kk_depends_on: []
kk_confidence: high
---
Review runs only when `code_review.enabled` in `config/config.yaml` is boolean `true`. Missing or false returns `review-disabled` before any schema, hook, or validator check. `resolveReviewContext` reads the preference through `discoverStrikethrooRoot` and applies the schema check afterwards. An empty `CODE_REVIEW.md` also disables review and survives refreshes. A deleted one is restored by `init`.

<!-- kk:related:start -->
# Related

- Related: [practice-review-gate-reports-it-does-not-fix](practice-review-gate-reports-it-does-not-fix.md)
<!-- kk:related:end -->
