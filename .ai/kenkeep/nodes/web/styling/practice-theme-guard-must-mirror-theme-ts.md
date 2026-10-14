---
type: practice
title: 'theme-guard.js duplicates theme.ts, so the two must change together'
description: >-
  theme.ts owns the tri-state preference and storage key. theme-guard.js repeats
  both before paint. ThemeProvider follows the OS only for system.
tags:
  - web
  - theme
  - dark-mode
  - styling
  - coupling
kk_schema_version: 3
kk_id: practice-theme-guard-must-mirror-theme-ts
kk_derived_from: []
kk_relates_to:
  - >-
    practice-vendoring-dalia-css-requires-the-foundational-dark-token-block-not-just-per-component-fixups
  - practice-spa-csp-is-a-response-header
kk_depends_on: []
kk_confidence: high
---
Dark mode is one `.dark` class on `document.documentElement`. The token swap in `tokens.css` and the `dark:` custom variant in `index.css` both key on that class, not on a media query.

`src/web/theme/theme.ts` is the source of truth. It defines the tri-state preference `light | dark | system`, defaulting to `system`, the storage key `THEME_STORAGE_KEY`, and the pure resolution helpers. `ThemeProvider` applies the preference on mount and on change. It re-applies on a `prefers-color-scheme` change only while the stored preference is `system`, so a manual Light or Dark choice stays put when the OS flips.

`src/web/public/theme-guard.js` runs before React, from `index.html`'s `<head>`, to avoid a flash of light theme. It is a plain classic script and cannot import `theme.ts`, so it repeats the storage key literal and the resolution rule. If you rename the key, add a preference value, or change how `system` resolves, change both files. No build step or test compares the two files, so drift shows up only as the wrong theme flashing on load.

<!-- kk:related:start -->
# Related

- Related: [practice-vendoring-dalia-css-requires-the-foundational-dark-token-block-not-just-per-component-fixups](practice-vendoring-dalia-css-requires-the-foundational-dark-token-block-not-just-per-component-fixups.md)
- Related: [practice-spa-csp-is-a-response-header](../rendering/practice-spa-csp-is-a-response-header.md)
<!-- kk:related:end -->
