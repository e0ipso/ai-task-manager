---
type: practice
title: Adding a skill means registering it in five places
description: >-
  A new skill needs its .hbs template, SKILL_ENTRYPOINTS entries, plugin.json,
  STRIKETHROO_WORKFLOW_SKILLS, and the mirror test's EXPECTED_SKILLS.
tags:
  - skills
  - skill-scripts
  - skill-prompts
  - build
  - registry
kk_schema_version: 3
kk_id: practice-adding-a-skill-touches-five-registries
kk_derived_from: []
kk_relates_to:
  - >-
    map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root
  - map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content
  - practice-update-notice-only-from-parent-workflow-skills
  - practice-never-hand-commit-generated-skill-artifacts
kk_depends_on: []
kk_confidence: high
---
The skill list is not derived from one source. A new skill has to appear in each of these:

- `src/skill-prompts/skills/<name>/SKILL.md.hbs`, with only `name` and `description` in its frontmatter. `scripts/build-skill-prompts.cjs` discovers skills by listing this directory.
- `SKILL_ENTRYPOINTS` in `scripts/build-skills.cjs`, one entry per script the skill bundles. Add a new TypeScript entrypoint under `src/skill-scripts/` when the skill needs logic that no existing entrypoint has. A parent workflow skill also bundles `find-strikethroo-root.ts` and `check-for-updates.ts`.
- `.claude-plugin/plugin.json`, as `./skills/<name>`.
- `STRIKETHROO_WORKFLOW_SKILLS` in `src/update.ts`. `strikethroo update` passes this list to `npx skills update`, so a skill missing here never gets refreshed by `update`.
- `EXPECTED_SKILLS` in `src/__tests__/skills-mirror.test.ts`, which asserts the tracked root `skills/` tree holds exactly these directories.

Watch the last two. `skills-mirror.test.ts` checks both `EXPECTED_SKILLS` and every `plugin.json` entry against the tracked root `skills/` tree. That tree changes only at release, and a hand edit there is forbidden, as `practice-never-hand-commit-generated-skill-artifacts` explains. A new entry in either list therefore fails the suite until a release writes the new directory. No documented procedure resolves this yet. Ask the maintainer before you pick one.

<!-- kk:related:start -->
# Related

- Related: [map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root](map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root.md)
- Related: [map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content](prompts/map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md)
- Related: [practice-update-notice-only-from-parent-workflow-skills](practice-update-notice-only-from-parent-workflow-skills.md)
- Related: [practice-never-hand-commit-generated-skill-artifacts](../practice-never-hand-commit-generated-skill-artifacts.md)
<!-- kk:related:end -->
