---
type: practice
title: Route workspace file access through shared/safe-fs.ts
description: >-
  One containment and atomic-write module serves the viewer, CLI, and skills. It
  refuses links and non-regular files; it does not stop a mid-call swap.
tags:
  - safe-fs
  - security
  - symlink
  - filesystem
  - metadata
  - skill-scripts
  - serve
kk_schema_version: 3
kk_id: practice-route-workspace-file-access-through-safe-fs
kk_derived_from: []
kk_relates_to:
  - practice-skill-scripts-build-boundary-keep-crossings-few
  - >-
    practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files
kk_depends_on: []
kk_confidence: high
---
`src/skill-scripts/shared/safe-fs.ts` is the one containment and atomic-write implementation for `serve`, the CLI domain, and the skill bundles. Do not write a second one. Current callers are `src/serve/config-write.ts`, `src/serve/workspace-model.ts`, `src/serve/self-review.ts`, `loadMetadata` and `saveMetadata` in `src/metadata.ts`, and the update-check state writer in `shared/update-check.ts`.

`resolveContained` walks every path component below the canonical workspace root with `lstat`. It refuses any symbolic link and any final target that is not a regular file, such as a FIFO, socket, or device. Links above the root are allowed. `readContainedFile` opens with `O_NOFOLLOW` where the platform has it, checks the descriptor with `fstat`, and bounds the read. `writeFileAtomic` writes an exclusive temp file in the same directory, syncs it, and renames it over the target. A new file gets mode `0o600` and an existing file keeps its mode, so a fresh `.init-metadata.json` and `runtime/update-check.json` are `0600`.

`loadMetadata` treats a linked metadata file, or a linked `.ai` or `.ai/strikethroo` directory above it, as an error and not as a first-time init. Treating it as a first-time init would let a link bypass conflict protection.

This defends against links planted before the call. The component walk and the final open are separate steps, so a process that swaps a directory component while the call runs is not covered. Hard links are out of scope. On Windows there is no `O_NOFOLLOW`, and a `dev`/`ino` comparison only narrows the race. The module comment states these limits in full.

<!-- kk:related:start -->
# Related

- Related: [practice-skill-scripts-build-boundary-keep-crossings-few](practice-skill-scripts-build-boundary-keep-crossings-few.md)
- Related: [practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files](../serve/practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files.md)
<!-- kk:related:end -->
