---
type: practice
title: 'security:check exceptions name one advisory and one audit-ci path'
description: >-
  audit-ci fails on high and critical advisories. Each allowlist entry is
  advisory|path with notes saying when to recheck. No wildcards.
tags:
  - tooling
  - security
  - audit-ci
  - npm
  - ci
  - dependencies
kk_schema_version: 3
kk_id: practice-security-check-audit-ci-exceptions-are-narrow
kk_derived_from: []
kk_relates_to:
  - practice-release-workflow-splits-verify-from-publish
kk_depends_on: []
kk_confidence: high
---
`npm run security:check` runs the pinned devDependency `audit-ci` against `security/audit-ci.json`. It audits the full lockfile, includes dev dependencies even under production npm settings, and fails on any high or critical advisory that is not allowlisted, and on audit errors. Every package gets the same threshold. Low and moderate advisories are informational. `test.yml` and the release `verify` job both run it.

Each allowlist key is `<GHSA id>|<audit-ci path>`. The `notes` field gives the rationale and the condition for rechecking it, and must contain `Recheck when`. Package-wide and wildcard suppressions are not used.

The paths come from npm's advisory graph, not the filesystem. Copies bundled inside npm itself show up with no parents, such as `brace-expansion`, `undici`, and `http-cache-semantics`. Some paths end with a trailing `>`. Before accepting an exception, read the `nodes` in `npm run security:audit-json`, because one advisory and path may also cover another installed copy.

Exceptions do not pin installed versions and do not fail when they stop matching anything. Review the allowlist whenever you upgrade or change how the release tooling is used.

`src/__tests__/ci-workflows.test.ts` checks the script entry, the exact pinned `audit-ci` version, the threshold and dev-inclusion settings, and the shape of every allowlist key.

<!-- kk:related:start -->
# Related

- Related: [practice-release-workflow-splits-verify-from-publish](../release/practice-release-workflow-splits-verify-from-publish.md)
<!-- kk:related:end -->
