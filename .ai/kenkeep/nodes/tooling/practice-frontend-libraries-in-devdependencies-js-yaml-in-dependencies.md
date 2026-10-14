---
type: practice
title: Frontend libraries stay in devDependencies; js-yaml stays in dependencies
description: >-
  serve ships prebuilt dist-web/, so SPA libraries are build-only. tsc emits
  profiles.ts unbundled, so js-yaml must stay a runtime dependency.
tags:
  - dependencies
  - devdependencies
  - js-yaml
  - npm
  - packaging
  - web
kk_schema_version: 3
kk_id: practice-frontend-libraries-in-devdependencies-js-yaml-in-dependencies
kk_derived_from: []
kk_relates_to:
  - >-
    practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily
  - >-
    practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime
kk_depends_on: []
kk_confidence: high
---
`serve` ships only the prebuilt static `dist-web/`, so the published package's runtime `dependencies` carry no frontend libraries. Vite, React, react-dom, Tailwind, `@tailwindcss/typography`, `@base-ui-components/react`, `lucide-react`, `mermaid`, `marked`, `dompurify`, the CodeMirror packages, and `@modyfi/vite-plugin-yaml` stay in `devDependencies`. Never move one to `dependencies`.

`js-yaml` is the exception and must stay in `dependencies`. `src/profiles.ts` and `src/export-profile.ts` import it, and `tsc` emits them to `dist/` without bundling. The npm package ships `dist/`, so `init --profile` and `export profile` load `js-yaml` from the installed package's `node_modules`. Moving it to `devDependencies` breaks both commands for anyone who installs from npm.

It looks build-only because its other users inline their own copy at build time. Vite bundles it into the SPA for `src/web/customize/configYaml.ts`, and esbuild bundles it into the skill `.cjs` files for `harness-configuration`, `execution-routing`, `task-frontmatter`, and `code-review-configuration`. Those copies do not make the runtime dependency removable.

<!-- kk:related:start -->
# Related

- Related: [practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily](../web/editor/practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily.md)
- Related: [practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime](../release/practice-spa-assets-are-prebuilt-and-force-added-into-release-commit-never-built-at-runtime.md)
<!-- kk:related:end -->
