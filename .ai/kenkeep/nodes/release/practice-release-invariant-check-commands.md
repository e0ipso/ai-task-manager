---
type: practice
title: Commands that check the release invariants for skills/ and the npm tarball
description: >-
  Six commands confirm skills/ matches the last tag, dist-test/ is untracked,
  and no SKILL.md ships to npm. npm pack lists files on stderr.
tags:
  - release
  - skills
  - npm
  - verification
  - recipe
kk_schema_version: 3
kk_id: practice-release-invariant-check-commands
kk_derived_from: []
kk_relates_to:
  - >-
    practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime
  - practice-use-git-rm-r-for-tracked-skill-output-dirs-not-rm-rf
  - practice-release-workflow-splits-verify-from-publish
kk_depends_on: []
kk_confidence: high
---
Run these from the repository root to confirm the two release channels are intact.

```bash
git ls-files 'dist-test/*'                                          # expect: EMPTY (never tracked)
git ls-files 'skills/*/SKILL.md' | wc -l                            # expect: 7 (one per skill)
git ls-files 'skills/*/references/*.md' | wc -l                     # expect: 3 (st-generate-tasks, st-full-workflow, st-code-review)
git diff --stat "$(git describe --tags --abbrev=0 --match 'v*')" -- skills/   # expect: EMPTY (matches the last release)
npm pack --dry-run 2>&1 | awk '{print $NF}' | grep -c 'SKILL\.md'  # expect: 0 (no skills in the npm channel)
npm run build:release-skills && git status --short skills/          # expect: EMPTY on an unchanged source
```

`npm pack --dry-run` writes its tarball listing to stderr. Without `2>&1`, the `grep` sees nothing and reports 0 whether or not skills leaked into the package.

The last command runs the release build locally and rewrites `skills/`. An empty status proves the build reproduces the committed tree. If the source has moved past the last release, the tree will differ. Restore it afterwards with `git checkout -- skills/ && git clean -fd skills/`.

<!-- kk:related:start -->
# Related

- Related: [practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime](practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime.md)
- Related: [practice-use-git-rm-r-for-tracked-skill-output-dirs-not-rm-rf](practice-use-git-rm-r-for-tracked-skill-output-dirs-not-rm-rf.md)
- Related: [practice-release-workflow-splits-verify-from-publish](practice-release-workflow-splits-verify-from-publish.md)
<!-- kk:related:end -->
