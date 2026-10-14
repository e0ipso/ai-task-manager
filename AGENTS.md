# AGENTS.md

Load and include ./AGENTS.local.md, it contains skill-specific instructions in a git-ignored file.

This file holds only what every task needs. Subsystem contracts, rationale, and gotchas live in the kenkeep knowledge base (loaded at the end of this file). Descend into the branch for the code you are about to touch before you change it.

Strikethroo is a CLI (`init`, `update`, `export profile`, `serve`, `validate`) plus seven harness-agnostic Agent Skills (`st-*`) that turn a work order into a plan, a task blueprint, and verified execution. User docs are in `docs/`; terms are in [`docs/glossary.md`](docs/glossary.md).

## Commands

```bash
npm run build          # tsc, SPA type-check and build, skill bundles, skill prompts
npm test               # unit (Vitest) then e2e (Playwright); run `npx playwright install --with-deps chromium` once
npm run lint:fix
npm run security:check # audit-ci gate that CI runs
npm run dev            # watch mode; dev:serve and dev:web for the viewer
node dist/cli.js init --harnesses claude --destination-directory /tmp/test
```

Integration and e2e tests run the compiled output, so build before testing.

## Rules any change can break

- **Design invariant.** Negotiable configuration is Markdown, guarantees are compiled. Enforcement a user must not loosen goes in TypeScript, never in a hook. Read [the design thesis](.ai/kenkeep/nodes/practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled.md) before changing `src/skill-prompts/` or `src/skill-scripts/`.
- **Never edit `skills/` or `dist-test/`.** `skills/` is written only by the release; `dist-test/` is local build output. Edit `src/skill-prompts/` (read its `AUTHORING.md` first) and `src/skill-scripts/`. A pre-commit guard and CI enforce this.
- **Import boundaries.** Nothing in `src/skill-scripts/` imports `src/validation/` or `src/serve/`. The SPA (`src/web/`) imports nothing from `src/skill-scripts/`. Crossings from `src/serve/` and `src/validation/` into `src/skill-scripts/shared/` stay few and deliberate.
- **Dependencies.** Frontend libraries stay in `devDependencies`. `js-yaml` stays in `dependencies`.
- **Workspace schema.** Bump `CURRENT_WORKSPACE_SCHEMA_VERSION` (`src/metadata.ts`) only for an incompatible workspace shape change.
- **Words.** "Strikethroo profile" (setup package) and `execution_routing.profiles` are different things. "Phase" means a blueprint task group only. Docs describe current state only.
- **Git.** Do not skip hooks with `--no-verify`. The commit-msg hook rejects AI attribution trailers, and pre-commit runs the full test suite.

## Where to look

| Area | Code | kenkeep branch |
| --- | --- | --- |
| CLI commands, refresh contract, profiles, validate | `src/cli.ts`, `src/index.ts`, `src/update.ts`, `src/profiles.ts`, `src/validation/` | `cli/` |
| Skill runtime, routing, dispatch, containment | `src/skill-scripts/` | `skills/` |
| Skill prompts | `src/skill-prompts/` | `skills/prompts/` |
| Code review gate | `src/skill-scripts/code-review.ts` | `code-review/` |
| Viewer server and its security model | `src/serve/` | `serve/` |
| Viewer SPA | `src/web/` | `web/` |
| Release, distribution, CI | `.github/workflows/`, `.releaserc.json` | `release/`, `tooling/` |
| Tests and fixtures | `src/__tests__/` | `testing/` |

In a Cursor Cloud VM, read [`.cursor/cloud-instructions.md`](.cursor/cloud-instructions.md).

<!-- >>> kenkeep:kk-index >>> -->
You are required to load [.ai/kenkeep/ENTRY.md](.ai/kenkeep/ENTRY.md), the small curated entry catalog for this repo. Enter there and descend using progressive disclosure principles.

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.
<!-- <<< kenkeep:kk-index <<< -->
