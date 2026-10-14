---
type: practice
title: 'Say strikethroo profile or execution profile, never bare profile'
description: >-
  Setup packages imported by init and execution_routing.profiles share only a
  word; name which one in code, docs, prompts, and output.
tags:
  - profiles
  - terminology
  - execution-routing
  - docs
kk_schema_version: 3
kk_id: practice-say-strikethroo-profile-or-execution-profile-never-bare-profile
kk_derived_from: []
kk_relates_to:
  - map-init-profile-resolves-validates-and-stages-a-strikethroo-profile
  - practice-strikethroo-profile-packages-tolerate-inert-package-root-extras
kk_depends_on: []
kk_confidence: high
---
Two unrelated features are called profiles. A strikethroo profile, also called a setup profile, is a package that `init --profile` imports once, handled in `src/profiles.ts` and `src/export-profile.ts`. `execution_routing.profiles` in `config/config.yaml` are task-routing execution profiles: task generation assigns one per task, and dispatch picks a target from it. They share nothing but the word.

Write "strikethroo profile" or "setup profile" for the first and "execution profile" for the second. That applies to code comments, docs, skill prompts, and CLI output. Never write bare "profile" where a reader could take it either way. The init output follows the rule, for example "This strikethroo profile assumes you have".

<!-- kk:related:start -->
# Related

- Related: [map-init-profile-resolves-validates-and-stages-a-strikethroo-profile](map-init-profile-resolves-validates-and-stages-a-strikethroo-profile.md)
- Related: [practice-strikethroo-profile-packages-tolerate-inert-package-root-extras](../practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md)
<!-- kk:related:end -->
