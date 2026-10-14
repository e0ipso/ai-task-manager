---
type: practice
title: validate's strict pass keeps its own frontmatter reader
description: >-
  strict-pass.ts must tell a missing field from a malformed one; the lenient
  viewer reader and shared plan scan cannot, so never merge them.
tags:
  - validate
  - frontmatter
  - serve
  - gotcha
kk_schema_version: 3
kk_id: practice-validate-strict-pass-keeps-its-own-frontmatter-reader
kk_derived_from: []
kk_relates_to:
  - map-validate-is-a-pure-read-only-consistency-check-over-plans
  - >-
    practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile
kk_depends_on: []
kk_confidence: high
---
`src/validation/strict-pass.ts` hand-rolls its frontmatter reader and its plan enumeration instead of reusing existing code. Do not deduplicate them. Each reader is correct for its own consumer.

The viewer's reader in `src/serve/markdown.ts` is lenient so a malformed plan still renders. It runs `parseInt` and leaves the field undefined on failure, so `id: abc` and a file with no `id:` line produce identical results. Telling those two cases apart is the reason the strict pass exists. The shared plan-scan helpers drop any plan whose `id` does not parse, so they cannot report the plans most likely to be broken.

The strict pass reads a quoted scalar up to its closing quote, so a trailing `# comment` is not part of the value, and an unterminated quote counts as malformed. It checks `complexity_score` only when the field is present, because only newly generated tasks require it.

<!-- kk:related:start -->
# Related

- Related: [map-validate-is-a-pure-read-only-consistency-check-over-plans](map-validate-is-a-pure-read-only-consistency-check-over-plans.md)
- Related: [practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile](practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile.md)
<!-- kk:related:end -->
