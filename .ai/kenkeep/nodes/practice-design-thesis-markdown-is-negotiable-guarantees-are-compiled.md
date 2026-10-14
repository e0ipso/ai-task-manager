---
type: practice
title: 'Design thesis: negotiable configuration is Markdown, guarantees are compiled'
description: >-
  Three premises drive src/skill-prompts and src/skill-scripts. Put enforcement
  a user must not loosen in TypeScript, never in a hook.
tags:
  - design-thesis
  - architecture
  - skills
  - review-gate
  - enforcement
kk_schema_version: 3
kk_id: practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled
kk_derived_from: []
kk_relates_to:
  - practice-review-gate-reports-it-does-not-fix
  - map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content
kk_depends_on: []
kk_confidence: high
---
Read this before changing `src/skill-prompts/` or `src/skill-scripts/`. Most odd-looking decisions in those trees follow from three premises. The user-facing version is `docs/why.md`.

1. The agent is an unreliable narrator of its own work. A subagent's success report is a claim, not evidence. That is why `config/shared/verification-gate.md` exists, and why each skill carries an anti-rationalization table listing the specific excuses a model produces right before it skips a discipline.
2. A second agent reviewing the first is also unreliable. The reviewer has its own rationalization table, is limited to conformance and demonstrable defects, and its findings go to a human-directed implementer. Its opinion is input, never a verdict.
3. The user's attention is the scarce resource, not tokens. Spend it on the plan, where a correction costs a sentence, and keep it off the diff, where the same correction costs a review cycle. The automated gate filters before the user reads, so it must not raise design or abstraction opinions. Those belong to the user's read.

The invariant: hooks, templates, and project context are user-editable Markdown, and guarantees live in TypeScript. Two examples are compiled today. An uncertified review is never reported as clean, and the reviewer and implementer run on separate harnesses. Editing a hook cannot loosen either. When you add enforcement, decide which side of that line it belongs on. A bound that a user can raise from a hook is not a bound.

The speed metric is time-to-merge, not time-to-first-draft. Do not trade merge-readiness for faster generation, and do not describe the project as trading speed for quality. On the time-to-merge clock they are the same number.

<!-- kk:related:start -->
# Related

- Related: [practice-review-gate-reports-it-does-not-fix](code-review/practice-review-gate-reports-it-does-not-fix.md)
- Related: [map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content](skills/prompts/map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md)
<!-- kk:related:end -->
