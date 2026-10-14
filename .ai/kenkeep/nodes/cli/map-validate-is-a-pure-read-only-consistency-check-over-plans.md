---
type: map
title: 'validate is a pure, read-only consistency check over plans/'
description: >-
  validateWorkspace takes a resolved root and returns findings; no severity,
  stable check ids, sorted output, plans/ only.
tags:
  - validate
  - cli
  - validation
  - ci
kk_schema_version: 3
kk_id: map-validate-is-a-pure-read-only-consistency-check-over-plans
kk_derived_from: []
kk_relates_to:
  - >-
    practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles
  - practice-validate-metadata-gate-reports-deleted-files-never-hash-drift
  - practice-validate-strict-pass-keeps-its-own-frontmatter-reader
  - >-
    practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile
  - >-
    map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed
kk_depends_on: []
kk_confidence: high
---
`strikethroo validate` reports proven internal inconsistencies and writes nothing. The CLI action in `src/cli.ts` resolves the root with `resolveWorkspaceRoot`, renders text or `--json`, and owns the exit code. `validateWorkspace(root)` in `src/validation/workspace.ts` takes the resolved `.ai/strikethroo` path and returns `{ findings }`. It does no discovery, prints nothing, and never exits, so the command, a CI job, and tests share one implementation. It must not call `findStrikethrooRoot`, which exits on schema skew. Skew is what `validate` is most useful for, so it reports skew as the `metadata/schema-version-skew` finding instead.

A `Finding` is `{ check, message, path? }` with no severity. Every finding is an error and any finding exits 1. Adding severity is a scope change. Tests and downstream tooling assert on `check` ids such as `graph/dependency-cycle`, so rename one only together with its consumers. `workspace.ts` sorts by check, path, then message because directory enumeration order depends on the filesystem.

Content checks read only `plans/`. An archived plan is immutable history, so a finding there cannot be acted on. `archive/` joins only `identity/duplicate-plan-id`, because plan ids are numbered across both trees. `config/` templates are not swept, since `TASK_TEMPLATE.md` holds literal placeholders like `status: "[STATUS]"` and would flag itself.

The checks live in `metadata-gate.ts`, `strict-pass.ts`, and `graph-checks.ts`. `workspace.ts` only calls them and sorts, and a new check goes in its group's file. Imports run one way. `src/validation/` may use `src/skill-scripts/shared/` and `src/serve/`, but nothing under `src/skill-scripts/` may import `src/validation/`, because esbuild would then bundle the validator into every skill `.cjs`.

<!-- kk:related:start -->
# Related

- Related: [practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles](../skills/practice-use-resolveworkspaceroot-not-findstrikethrooroot-outside-skill-bundles.md)
- Related: [practice-validate-metadata-gate-reports-deleted-files-never-hash-drift](practice-validate-metadata-gate-reports-deleted-files-never-hash-drift.md)
- Related: [practice-validate-strict-pass-keeps-its-own-frontmatter-reader](practice-validate-strict-pass-keeps-its-own-frontmatter-reader.md)
- Related: [practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile](practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile.md)
- Related: [map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed](../skills/map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed.md)
<!-- kk:related:end -->
