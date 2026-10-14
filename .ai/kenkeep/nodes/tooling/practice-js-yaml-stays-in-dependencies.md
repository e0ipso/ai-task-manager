---
type: practice
title: js-yaml stays in dependencies; frontend libraries do not
description: >-
  dist/profiles.js loads js-yaml at runtime. SPA libraries are build-only
  because serve ships prebuilt assets.
tags:
  - dependencies
  - npm
kk_schema_version: 3
kk_id: practice-js-yaml-stays-in-dependencies
kk_derived_from: []
kk_relates_to:
  - practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily
kk_depends_on: []
kk_confidence: high
---
Frontend libraries stay in `devDependencies` because `serve` ships prebuilt `dist-web/`. `js-yaml` stays in `dependencies`, because `tsc` emits `src/profiles.ts` and `src/export-profile.ts` unbundled and they load it at runtime.

Exceptions in `security/audit-ci.json` name one advisory and path each, never a whole package.
