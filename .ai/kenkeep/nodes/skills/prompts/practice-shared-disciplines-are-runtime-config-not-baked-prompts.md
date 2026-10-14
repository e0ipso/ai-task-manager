---
type: practice
title: Cross-skill disciplines ship as runtime config/shared files
description: >-
  verification-gate, clarification-gate, and anti-rationalization are read at
  runtime from config/shared/. Adding one is a workspace schema change.
tags:
  - skill-prompts
  - config-shared
  - schema-version
  - verification-gate
  - lifecycle
kk_schema_version: 3
kk_id: practice-shared-disciplines-are-runtime-config-not-baked-prompts
kk_derived_from: []
kk_relates_to:
  - >-
    practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication
  - map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content
  - practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled
  - practice-review-gate-reports-it-does-not-fix
kk_depends_on: []
kk_confidence: high
---
Enforcement disciplines shared across skills are not compiled into each `SKILL.md`. They ship as required, project-customizable files under `config/shared/`, which `init` copies and hash-tracks like hooks. Skills read them at runtime.

- `verification-gate.md` is the evidence-before-claims gate, applied at phase completion and post-execution in `st-execute-blueprint` and `st-full-workflow`.
- `clarification-gate.md` covers one question at a time, multiple choice first, and approval before emitting. `st-create-plan` and `st-refine-plan` use it.
- `anti-rationalization.md` is the shared excuse and red-flag framing. `st-create-plan`, `st-generate-tasks`, and `st-execute-blueprint` each keep their own rationalization table inline and point to this file.

These files are required workspace shape. Adding one bumps `CURRENT_WORKSPACE_SCHEMA_VERSION`, and older workspaces must rerun `init` before they can use the updated skills. Runtime config holds instructions only. Notes about init, hash tracking, or loading go in `docs/customization.md` or `AGENTS.md`. `src/skill-prompts/AUTHORING.md` defines when content is a build-time partial, runtime config, inline text, or a `references/` file.

Both execution skills share `_partials/procedure-execute-blueprint.md.hbs`, and its call site keeps the terminal order visible: `POST_EXECUTION` validation, then `{{> code-review-gate}}`, then `{{> summary-and-archive}}`. Keep those three steps at the call site and do not fold them into one partial. The gate partial consumes the compiled result's `action` and does not restate its decision table.

<!-- kk:related:start -->
# Related

- Related: [practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication](practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication.md)
- Related: [map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content](map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md)
- Related: [practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled](../../practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled.md)
- Related: [practice-review-gate-reports-it-does-not-fix](../../code-review/practice-review-gate-reports-it-does-not-fix.md)
<!-- kk:related:end -->
