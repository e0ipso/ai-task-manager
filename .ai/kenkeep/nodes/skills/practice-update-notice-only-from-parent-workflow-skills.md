---
type: practice
title: Only parent workflow skills check for updates and emit the notice
description: >-
  check-for-updates.cjs runs in six parent skills, at most once per workspace
  per 24h. Reviewers and delegated workers never check; the notice ends the
  turn.
tags:
  - update-check
  - skills
  - skill-prompts
  - notice
  - runtime
kk_schema_version: 3
kk_id: practice-update-notice-only-from-parent-workflow-skills
kk_derived_from: []
kk_relates_to:
  - map-installed-skills-in-claude-skills-are-decoupled-from-repo-builds
  - practice-optional-by-absence-new-files-absent-means-feature-off
kk_depends_on: []
kk_confidence: high
---
Every workflow skill except `st-code-review` runs `scripts/check-for-updates.cjs` after root discovery, as its own command and separate from `find-strikethroo-root` output. The shared step is `_partials/update-check-default.md.hbs`. `st-code-review` has no entry for it in `SKILL_ENTRYPOINTS`.

The script makes at most one network attempt and shows at most one notice per workspace every 24 hours. Its state lives in the gitignored `.ai/strikethroo/runtime/update-check.json`. The parent keeps the notice text and appends it as the last sentence of its turn, after the intact structured summary fence. Nothing may follow it. `_partials/update-notice-close.md.hbs` holds that rule, and `AUTHORING.md` repeats it for the summary blocks that outside tools parse.

`config/templates/UPDATE_NOTICE_TEMPLATE.md` is optional by absence. When it is missing or blank, the bundled default applies. When the workspace metadata has no saved `harnesses`, the notice tells the agent to ask the user for `--harnesses` instead of printing a command with placeholders.

Delegated execution workers never check and never emit a notice. The phase loop and `st-execute-task` tell them so. `st-full-workflow` runs the check once at startup and leaves it out of its later stages, so one run emits at most one notice.

Skill copies installed before this feature cannot notify. A user has to run `update` once to get skills that check. A running agent may also keep the old skill text until a new session starts.

<!-- kk:related:start -->
# Related

- Related: [map-installed-skills-in-claude-skills-are-decoupled-from-repo-builds](../release/map-installed-skills-in-claude-skills-are-decoupled-from-repo-builds.md)
- Related: [practice-optional-by-absence-new-files-absent-means-feature-off](../code-review/practice-optional-by-absence-new-files-absent-means-feature-off.md)
<!-- kk:related:end -->
