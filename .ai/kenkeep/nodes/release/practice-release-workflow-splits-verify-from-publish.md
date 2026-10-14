---
type: practice
title: >-
  The release workflow splits a read-only verify job from a credentialed release
  job
description: >-
  verify installs, builds, and tests with no secrets. release publishes via npm
  trusted publishing (id-token, no NPM_TOKEN) and installs with
  --ignore-scripts.
tags:
  - release
  - ci
  - github-actions
  - security
  - npm
  - semantic-release
kk_schema_version: 3
kk_id: practice-release-workflow-splits-verify-from-publish
kk_derived_from: []
kk_relates_to:
  - >-
    practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime
  - map-releaserc-json-repositoryurl-must-match-current-github-repo-slug
  - practice-security-check-audit-ci-exceptions-are-narrow
kk_depends_on: []
kk_confidence: high
---
`.github/workflows/release.yml` has two jobs so that dependency install scripts and tests never run next to publish credentials.

**verify.** It has `contents: read`, no secrets, and a checkout with `persist-credentials: false`. It checks that `skills/` matches the last `v*` tag, then installs, builds, installs Chromium for the e2e half of `npm test`, tests, and runs `npm run security:check`.

**release.** It needs `verify` and holds `contents: write`, plus `issues: write` and `pull-requests: write` for `@semantic-release/github`'s comments, and `id-token: write`. npm publication uses trusted publishing. `@semantic-release/npm` exchanges the job's OIDC token for a short-lived credential, and there is no `NPM_TOKEN` secret. Removing `id-token` makes the release fail at `verifyConditions`. The job installs with `npm ci --ignore-scripts` and builds again. Only the `npx semantic-release` step sees `GITHUB_TOKEN` and `HUSKY=0`. The split limits what installs and tests can reach. It does not remove trust in the release tooling that runs in this job.

**Every workflow.** Each `uses:` is pinned to a full commit SHA with the version tag in a trailing comment. Each workflow declares least-privilege `permissions` at the top and per job. A new action or a version bump keeps the pin. `src/__tests__/ci-workflows.test.ts` enforces the pins, the permissions, `persist-credentials: false` on every checkout, and the job split, so a workflow edit that breaks them fails the unit suite.

<!-- kk:related:start -->
# Related

- Related: [practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime](practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime.md)
- Related: [map-releaserc-json-repositoryurl-must-match-current-github-repo-slug](map-releaserc-json-repositoryurl-must-match-current-github-repo-slug.md)
- Related: [practice-security-check-audit-ci-exceptions-are-narrow](../tooling/practice-security-check-audit-ci-exceptions-are-narrow.md)
<!-- kk:related:end -->
