---
type: practice
title: 'validate''s metadata gate reports deleted files, never hash drift'
description: >-
  A changed hash is a user edit that init protects, so it is not a finding;
  OPTIONAL_BY_ABSENCE lists files whose absence is valid.
tags:
  - validate
  - metadata
  - optional-gates
  - hash-tracking
kk_schema_version: 3
kk_id: practice-validate-metadata-gate-reports-deleted-files-never-hash-drift
kk_derived_from: []
kk_relates_to:
  - map-validate-is-a-pure-read-only-consistency-check-over-plans
  - practice-optional-by-absence-new-files-absent-means-feature-off
  - practice-init-refresh-decides-each-config-path-against-its-recorded-baseline
kk_depends_on: []
kk_confidence: high
---
`src/validation/metadata-gate.ts` reads `.init-metadata.json`. It reports a file that is unreadable, unparsable, or not an object, a `workspaceSchemaVersion` other than `CURRENT_WORKSPACE_SCHEMA_VERSION`, a missing `files` map, and every recorded path that is gone from disk. A missing `files` map ends the scan, because there is nothing left to compare.

A hash mismatch is never a finding. A changed hash is how the tool detects user modification, which is the state hash tracking exists to protect. Reporting it would fire on every customized or profile-imported workspace.

Some recorded paths may be absent on purpose: `config/hooks/CODE_REVIEW.md`, `config/schemas/self-review-v2.xsd`, and `config/templates/UPDATE_NOTICE_TEMPLATE.md`. Their absence is a valid state, so the gate skips them. The list is the `OPTIONAL_BY_ABSENCE` set in `metadata-gate.ts`, hard-coded because nothing machine-readable ships the contract. A new optional-by-absence file has to be added there too, or `validate` reports its absence as `metadata/file-deleted`. A required path that is gone is still reported.

<!-- kk:related:start -->
# Related

- Related: [map-validate-is-a-pure-read-only-consistency-check-over-plans](map-validate-is-a-pure-read-only-consistency-check-over-plans.md)
- Related: [practice-optional-by-absence-new-files-absent-means-feature-off](../code-review/practice-optional-by-absence-new-files-absent-means-feature-off.md)
- Related: [practice-init-refresh-decides-each-config-path-against-its-recorded-baseline](practice-init-refresh-decides-each-config-path-against-its-recorded-baseline.md)
<!-- kk:related:end -->
