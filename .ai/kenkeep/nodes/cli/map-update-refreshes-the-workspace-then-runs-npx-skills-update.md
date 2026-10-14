---
type: map
title: 'update refreshes the workspace, then runs npx skills update'
description: >-
  src/update.ts runs init's refresh without implicit --force, then the skills
  installer; zero-exit installer no-ops count as failure.
tags:
  - update
  - cli
  - skills
  - installer
kk_schema_version: 3
kk_id: map-update-refreshes-the-workspace-then-runs-npx-skills-update
kk_derived_from: []
kk_relates_to:
  - practice-init-refresh-decides-each-config-path-against-its-recorded-baseline
  - practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only
  - >-
    map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed
kk_depends_on: []
kk_confidence: high
---
`update` in `src/update.ts` refuses a workspace without usable `.init-metadata.json`, resolves harnesses the same way `init` does, and calls `init` in update mode. It gets the same conflict handling and adds no implicit `--force`. A failed refresh skips the installer.

After a good refresh it spawns `npx skills update` for the seven workflow skills in `STRIKETHROO_WORKFLOW_SKILLS`, with `shell: false`, inherited stdin, and stdout and stderr streamed through. The installer chooses the installation scope. Strikethroo does not infer scope from the saved harnesses.

The installer exits 0 for several outcomes that update nothing: no matching installed skills, skills it cannot update in place, a cancelled prompt, a failed check. `runSkillsInstaller` watches the streamed output for those messages and treats them as an incomplete update.

Exit 0 needs both steps to succeed. When the installer fails after a good refresh, the refreshed workspace stays, the command prints the manual `npx skills update ...` line as recovery, and exits 1. It also warns that a running agent may keep the old skill instructions until a fresh session. The command users copy is `npx strikethroo@latest update`.

<!-- kk:related:start -->
# Related

- Related: [practice-init-refresh-decides-each-config-path-against-its-recorded-baseline](practice-init-refresh-decides-each-config-path-against-its-recorded-baseline.md)
- Related: [practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only](practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only.md)
- Related: [map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed](../skills/map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed.md)
<!-- kk:related:end -->
