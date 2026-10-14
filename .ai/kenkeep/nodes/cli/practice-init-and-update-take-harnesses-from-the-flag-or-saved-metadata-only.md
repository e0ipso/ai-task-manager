---
type: practice
title: Init and update take harnesses from the flag or saved metadata only
description: >-
  resolveInitHarnesses: explicit --harnesses wins, else the saved list; no
  auto-detection, and legacy metadata needs the flag once.
tags:
  - init
  - update
  - harnesses
  - metadata
kk_schema_version: 3
kk_id: practice-init-and-update-take-harnesses-from-the-flag-or-saved-metadata-only
kk_derived_from: []
kk_relates_to:
  - practice-init-refresh-decides-each-config-path-against-its-recorded-baseline
kk_depends_on: []
kk_confidence: high
---
`resolveInitHarnesses` in `src/resolve-init-harnesses.ts` picks the harness list for both `init` and `update`. An explicit `--harnesses` wins. Without it, the `harnesses` array saved in `.init-metadata.json` is reused. There is no filesystem or executable auto-detection.

A flag supplied empty or invalid throws. It does not fall back to the saved list. Only an omitted flag reaches the saved selection.

Legacy metadata without `harnesses`, or with a saved list that `normalizeSavedHarnesses` discards as invalid, needs `--harnesses` once. `init` resolves the list before it touches the destination, so a missing selection fails with nothing written. After a successful run, `recordHarnessSelection` saves the list, and the next run can omit the flag.

<!-- kk:related:start -->
# Related

- Related: [practice-init-refresh-decides-each-config-path-against-its-recorded-baseline](practice-init-refresh-decides-each-config-path-against-its-recorded-baseline.md)
<!-- kk:related:end -->
