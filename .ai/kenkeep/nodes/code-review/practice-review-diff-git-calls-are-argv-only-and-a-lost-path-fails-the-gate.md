---
type: practice
title: 'Review diff Git calls are argv-only, and a lost path fails the gate'
description: >-
  execGit runs git with no shell and NUL-split listings. Any failed step makes
  _readCumulativeDiff null, an infrastructure failure, not a smaller scope.
tags:
  - review-gate
  - git
  - diff-scope
  - shell-safety
kk_schema_version: 3
kk_id: practice-review-diff-git-calls-are-argv-only-and-a-lost-path-fails-the-gate
kk_derived_from: []
kk_relates_to:
  - practice-review-gate-reports-it-does-not-fix
  - practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore
kk_depends_on: []
kk_confidence: high
---
Every Git call in the review scope goes through `execGit` or `execGitDiffAllowingChanges` in `src/skill-scripts/shared/git-utils.ts`. Both use `execFileSync('git', args)` with no shell, so paths, workspaces, branch names, and commits are data and never become part of a command string. `capture-base-commit.ts` and `create-feature-branch.ts` use the same helpers. Do not add a shell-string Git call.

Changed-path and untracked-path listings use `-z` and `splitNulDelimited`. `git check-attr` gets its paths on stdin with `--stdin -z`, so no filename becomes an argument.

**A lost path is a failure.** In `_readCumulativeDiff` in `src/skill-scripts/code-review.ts`, a failed changed-path listing, untracked listing, `check-attr`, tracked diff, or any single untracked add-diff returns `null`. `runReview` reports that as an infrastructure failure. The reviewer never sees a scope that quietly dropped a file.

**The `--no-index` exit code.** `git diff --no-index` exits 1 when files differ, which is the normal case for an add-diff. It also exits 1 with no output when it cannot open a path. `execGitDiffAllowingChanges` therefore accepts exit 1 only when stdout is non-empty, and a bare exit 1 counts as a failed add-diff.

**Non-UTF-8 names.** Git output is decoded as UTF-8. A non-UTF-8 untracked filename reaches Git altered, cannot be opened, and fails the gate instead of shrinking the scope. Tracked non-UTF-8 names stay in scope through the tracked diff. Covering untracked ones would need a different add-diff mechanism.

<!-- kk:related:start -->
# Related

- Related: [practice-review-gate-reports-it-does-not-fix](practice-review-gate-reports-it-does-not-fix.md)
- Related: [practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore](../practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md)
<!-- kk:related:end -->
