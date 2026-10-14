---
type: practice
title: Review certification accepts only XSD syntax and an xmllint-confirmed count
description: >-
  DTD declarations are refused before validation, xmllint never expands
  entities, and the tag scanner's count must match xmllint --xpath.
tags:
  - review-gate
  - certification
  - xmllint
  - xml-security
kk_schema_version: 3
kk_id: practice-review-certification-accepts-only-xsd-syntax-and-a-confirmed-count
kk_derived_from: []
kk_relates_to:
  - practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them
  - practice-review-gate-reports-it-does-not-fix
  - practice-optional-by-absence-new-files-absent-means-feature-off
kk_depends_on: []
kk_confidence: high
---
The vendored XSD is the only certification authority, and `src/skill-scripts/shared/review-findings.ts` refuses anything outside its syntax. `hasForbiddenDeclarations` rejects a delivered document that has `<!DOCTYPE`, `<!ENTITY`, `<!ELEMENT`, `<!ATTLIST`, or `<!NOTATION` outside comments and CDATA. The result is `schema-invalid`, and the document never reaches the validator. A DTD can change what the validator sees, and the tag scanner cannot read such constructs safely.

`xmllint` always runs with `--nonet`. Never add `--noent`, `--dtdattr`, or `--loaddtd`.

The tag scanner in `parseReviewFindings` is safe only after validation, and it never decides a count by itself. `createFindingsGate` in `src/skill-scripts/code-review.ts` cross-checks its `<comment>` count against `countCommentsWithXmllint`, an independent `xmllint --xpath` count by local name. A mismatch gives `findings-absent`. If xmllint returns no clean number, the result is `validator-unavailable`. Neither outcome records a finding.

**The compiled guarantee.** An uncertified review is never reported as clean. `reviewedFieldsFor` returns `review-recorded` only for the `evaluated` outcome, and `_classify` derives `action` and the exit code from one switch. This is TypeScript on purpose. Users can edit hooks, but they cannot loosen this rule.

**Soft dependency.** Without `xmllint` nothing can be certified. The gate checks for it before dispatch and skips as `validator-absent`. A missing system package then never fails an otherwise good plan, and no external harness run is wasted. Both CI workflows install `libxml2-utils` so the validation path runs in CI.

<!-- kk:related:start -->
# Related

- Related: [practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them](practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them.md)
- Related: [practice-review-gate-reports-it-does-not-fix](practice-review-gate-reports-it-does-not-fix.md)
- Related: [practice-optional-by-absence-new-files-absent-means-feature-off](practice-optional-by-absence-new-files-absent-means-feature-off.md)
<!-- kk:related:end -->
