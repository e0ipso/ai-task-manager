---
type: practice
title: Harness cli_args are exact local strings and executable authority
description: >-
  cli_args are kept byte-for-byte, spawned with shell:false, shared by task,
  review, and readiness. They, hooks, and the selector run unsandboxed.
tags:
  - harness
  - cli-args
  - config-yaml
  - security
  - dispatch
  - profiles
kk_schema_version: 3
kk_id: practice-harness-cli-args-are-exact-local-strings-and-executable-authority
kk_derived_from: []
kk_relates_to:
  - map-model-optional-dispatch-reviewer-harness-omits-model
  - practice-strikethroo-profile-packages-tolerate-inert-package-root-extras
  - practice-empty-config-yaml-means-nothing-configured-in-every-reader
kk_depends_on: []
kk_confidence: high
---
The top-level `harnesses` section of `config/config.yaml` holds an ordered `cli_args` array for each supported harness. `src/skill-scripts/shared/harness-configuration.ts` keeps every value byte-for-byte after YAML decoding. It never trims or splits them. It rejects NUL characters and unknown shapes, and `hashHarnessCliArgs` hashes a versioned form of the harness and its ordered arguments. There is no permission denylist, because the file is local. The shipped template gives each harness its broad-permission flag.

`src/skill-scripts/shared/external-dispatch.ts` builds every adapter and always spawns with `shell: false`. Task dispatch, review dispatch, and readiness probes all pass the same ordered arguments. Authentication and status commands are literal adapter commands and never receive `cli_args`. Never put credentials or tokens in `cli_args`.

**Trust.** Hooks, the optional selector script, and `cli_args` are executable authority, not data. Hooks steer an agent that holds the harness's permissions. The selector runs as a local process. `cli_args` can give a spawned CLI broad filesystem and command access. Nothing sandboxes any of them. A strikethroo setup profile that carries them is code, and someone has to read it before importing it. The profile import checks for `--` and links protect the import mechanics only. They say nothing about what the package intends.

<!-- kk:related:start -->
# Related

- Related: [map-model-optional-dispatch-reviewer-harness-omits-model](../code-review/map-model-optional-dispatch-reviewer-harness-omits-model.md)
- Related: [practice-strikethroo-profile-packages-tolerate-inert-package-root-extras](../practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md)
- Related: [practice-empty-config-yaml-means-nothing-configured-in-every-reader](practice-empty-config-yaml-means-nothing-configured-in-every-reader.md)
<!-- kk:related:end -->
