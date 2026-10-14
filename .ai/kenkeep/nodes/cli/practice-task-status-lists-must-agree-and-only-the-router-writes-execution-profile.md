---
type: practice
title: 'Task status lists must agree, and only the router writes execution_profile'
description: >-
  The status enum is copied by hand in task-file.ts, strict-pass.ts, and
  TASK_TEMPLATE.md; the template leaves execution_profile commented out.
tags:
  - tasks
  - frontmatter
  - validate
  - execution-routing
  - templates
kk_schema_version: 3
kk_id: >-
  practice-task-status-lists-must-agree-and-only-the-router-writes-execution-profile
kk_derived_from: []
kk_relates_to:
  - practice-validate-strict-pass-keeps-its-own-frontmatter-reader
  - map-validate-is-a-pure-read-only-consistency-check-over-plans
  - practice-task-routing-classifies-at-generation-and-selects-at-dispatch
kk_depends_on: []
kk_confidence: high
---
The task `status` enum is `pending`, `in-progress`, `completed`, `needs-clarification`, `failed`. Three hand-kept copies must agree: `TASK_STATUSES` in `src/skill-scripts/shared/task-file.ts`, which the readiness reader uses, the separate `TASK_STATUSES` in `src/validation/strict-pass.ts`, and the comment on the `status` line of `templates/strikethroo/config/templates/TASK_TEMPLATE.md`. Nothing machine-readable ships the enum. `failed` is a legitimate state, because `st-execute-task` and the dispatch outcomes write it. Change one copy without the others and the readiness reader or `validate` rejects a task the rest of the system wrote.

`route-task-execution.cjs` is the only writer of `execution_profile`, through `writeExecutionProfileFrontmatter` in `src/skill-scripts/shared/execution-routing.ts`. For that reason `TASK_TEMPLATE.md` carries the field as a commented-out line, so a task copied from the template never gets one by hand. The other optional field, `complexity_notes`, comes from the task-generation skills and is absent from the template.

<!-- kk:related:start -->
# Related

- Related: [practice-validate-strict-pass-keeps-its-own-frontmatter-reader](practice-validate-strict-pass-keeps-its-own-frontmatter-reader.md)
- Related: [map-validate-is-a-pure-read-only-consistency-check-over-plans](map-validate-is-a-pure-read-only-consistency-check-over-plans.md)
- Related: [practice-task-routing-classifies-at-generation-and-selects-at-dispatch](../skills/practice-task-routing-classifies-at-generation-and-selects-at-dispatch.md)
<!-- kk:related:end -->
