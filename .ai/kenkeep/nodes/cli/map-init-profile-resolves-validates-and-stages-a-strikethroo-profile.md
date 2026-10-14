---
type: map
title: 'How init --profile resolves, validates, and stages a strikethroo profile'
description: >-
  src/profiles.ts: fixed source resolution order, all-or-nothing link-refusing
  validation, overlay staging fed to copyCommonTemplates.
tags:
  - profiles
  - init
  - security
  - git
kk_schema_version: 3
kk_id: map-init-profile-resolves-validates-and-stages-a-strikethroo-profile
kk_derived_from: []
kk_relates_to:
  - practice-strikethroo-profile-packages-tolerate-inert-package-root-extras
  - practice-say-strikethroo-profile-or-execution-profile-never-bare-profile
  - map-export-profile-copies-workspace-config-verbatim-without-redaction
  - practice-init-refresh-decides-each-config-path-against-its-recorded-baseline
kk_depends_on: []
kk_confidence: high
---
`init --profile <value>` runs `prepareProfileImport` in `src/profiles.ts` before any workspace write. The manifest fields and the accepted `schema_version`, `PROFILE_MANIFEST_SCHEMA_VERSION`, live in that file. A mismatched version is refused with a message naming both versions and which side to upgrade. `requires` and `recommends` are only printed during init, never probed or installed.

`resolveProfileSource` tries a fixed order. An existing directory is read in place, and that check runs first so a relative local path that looks like `user/repo` stays a folder. A directory with no `profile.yaml` but a `HEAD` file or `.git` entry is the exception. It is treated as a clone URL, so a bare repository clones instead of failing validation. Next, `<user>/<repo>` expands to a GitHub URL, and anything else goes to git as a URL. A value starting with `-` that is not an existing directory is refused before git runs, and the shallow clone also puts `--` before the source.

`validateProfilePackage` runs before staging and is all-or-nothing. It refuses a symbolic link at `profile.yaml`, at `config/`, or anywhere inside `config/`, so a package cannot pull in content from outside itself. `schemas/` is CLI-owned, and a profile may not ship it. Staging copies the shipped `templates/strikethroo/` tree into a temp directory and overlays the profile's `config/`. `copyCommonTemplates` uses that tree as its source, so profile files get the same prompts, `--force`, and hash tracking as stock files. Temp directories are removed on every exit path.

Import is fork-and-forget. Nothing tracks upstream, and a later plain `init` uses the shipped defaults. The `profile` field in `.init-metadata.json` records name, source, and import time for display only. Nothing reads it for behavior, and later refreshes carry it forward unchanged.

<!-- kk:related:start -->
# Related

- Related: [practice-strikethroo-profile-packages-tolerate-inert-package-root-extras](../practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md)
- Related: [practice-say-strikethroo-profile-or-execution-profile-never-bare-profile](practice-say-strikethroo-profile-or-execution-profile-never-bare-profile.md)
- Related: [map-export-profile-copies-workspace-config-verbatim-without-redaction](map-export-profile-copies-workspace-config-verbatim-without-redaction.md)
- Related: [practice-init-refresh-decides-each-config-path-against-its-recorded-baseline](practice-init-refresh-decides-each-config-path-against-its-recorded-baseline.md)
<!-- kk:related:end -->
