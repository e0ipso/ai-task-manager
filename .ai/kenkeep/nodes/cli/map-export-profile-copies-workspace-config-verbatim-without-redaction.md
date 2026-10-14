---
type: map
title: export profile copies workspace config verbatim without redaction
description: >-
  exportProfile copies config/ minus schemas/, validates its own output, and
  warns that config.yaml and cli_args ship as-is.
tags:
  - profiles
  - export
  - security
  - config
kk_schema_version: 3
kk_id: map-export-profile-copies-workspace-config-verbatim-without-redaction
kk_derived_from: []
kk_relates_to:
  - map-init-profile-resolves-validates-and-stages-a-strikethroo-profile
  - practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace
  - practice-say-strikethroo-profile-or-execution-profile-never-bare-profile
kk_depends_on: []
kk_confidence: high
---
`strikethroo export profile` runs `exportProfile` in `src/export-profile.ts`. It resolves the workspace with `resolveWorkspaceRoot`. Before prompting or writing, it refuses a `config/` tree that contains a symbolic link and a destination that is not empty. It then copies `config/` verbatim minus the CLI-owned `schemas/`. The copy is the whole config, not a diff against shipped defaults. The manifest comes from interactive prompts or the programmatic `manifest` option.

The export finishes by running `validateProfilePackage` on its own output, the same contract `init --profile` enforces, so every export round-trips.

After a successful export it prints `EXPORT_SHARING_NOTICE`. The package carries `config/config.yaml`, hooks, templates, and shared files exactly as they are on disk, including machine-local paths and harness `cli_args`. There is no secret detection and no redaction. The workspace `.gitignore` ignores `config.yaml`, but export reads the file from disk, so the ignore rule does not keep it out of the package.

Hooks, the optional selector script reference, and `cli_args` are executable authority, and nothing sandboxes imported content. Review a package before sharing it and read one before importing it. The `--` and link checks protect the import mechanics, not the intent of the package.

<!-- kk:related:start -->
# Related

- Related: [map-init-profile-resolves-validates-and-stages-a-strikethroo-profile](map-init-profile-resolves-validates-and-stages-a-strikethroo-profile.md)
- Related: [practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace](../practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md)
- Related: [practice-say-strikethroo-profile-or-execution-profile-never-bare-profile](practice-say-strikethroo-profile-or-execution-profile-never-bare-profile.md)
<!-- kk:related:end -->
