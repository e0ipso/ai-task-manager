---
type: practice
title: Task routing classifies at generation and selects a target at dispatch
description: >-
  route-task-execution.cjs alone writes execution_profile.
  dispatch-task-execution.cjs picks a target, rejects bad frontmatter with exit
  2.
tags:
  - execution-routing
  - dispatch
  - skill-scripts
  - task-frontmatter
  - harness
kk_schema_version: 3
kk_id: practice-task-routing-classifies-at-generation-and-selects-at-dispatch
kk_derived_from: []
kk_relates_to:
  - practice-harness-cli-args-are-exact-local-strings-and-executable-authority
  - map-model-optional-dispatch-reviewer-harness-omits-model
  - >-
    map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root
kk_depends_on: []
kk_confidence: high
---
Routing happens in two steps.

At task generation, `st-generate-tasks` and `st-full-workflow` classify each task in context into a named profile from the `execution_routing` section of `config/config.yaml`. The `TASK_EXECUTION_ROUTING.md` hook guides the choice. `route-task-execution.cjs` validates the whole assignment at once and writes only `execution_profile`. It is the only writer of that field, so never set it by hand. A task without it runs on the current harness defaults.

Just before delegation, `dispatch-task-execution.cjs` picks one target from the persisted profile.

- `allow_external_harness_execution` defaults to false, and an absent key counts as false. Until it is true, only targets with no harness or the current harness are eligible.
- The built-in selector takes the first eligible, non-avoided target in configuration order. An optional repository-relative selector script can choose instead.
- An unavailable target joins the avoid set and selection retries. Exhaustion or a selector failure falls back visibly to the current harness with no model or reasoning override.
- A current-harness target skips harness configuration loading and readiness probing.
- Dispatch reads the local configuration at launch. Editing it between resolution and execution is unsupported.

Task markdown is untrusted. `src/skill-scripts/shared/task-frontmatter.ts` reads frontmatter as YAML data only. A language-tagged fence such as `---js`, malformed YAML, a non-mapping document, or an `execution_profile` that is not a non-empty string produces `infrastructure-failure` with exit 2. It never falls back silently to a native run.

`launched-success` means only that the child exited zero. Task status and verification evidence decide whether the task is complete.

<!-- kk:related:start -->
# Related

- Related: [practice-harness-cli-args-are-exact-local-strings-and-executable-authority](practice-harness-cli-args-are-exact-local-strings-and-executable-authority.md)
- Related: [map-model-optional-dispatch-reviewer-harness-omits-model](../code-review/map-model-optional-dispatch-reviewer-harness-omits-model.md)
- Related: [map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root](map-find-strikethroo-root-ts-skill-scripts-utility-that-locates-the-ai-strikethroo-workspace-root.md)
<!-- kk:related:end -->
