---
okf_version: '0.1'
---
# kenkeep Index

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
- Load [`capture/`](capture/index.md) for more information on the documentation-visual capture harness — its committed fixture workspace and Playwright SPA-driving technique.
- Load [`cli/`](cli/index.md) for more information on the strikethroo CLI commands: init and update refresh contract, setup profiles, workspace validation, and the workspace schema version.
- Load [`code-review/`](code-review/index.md) for more information on the report-only code review gate — reviewer discovery and dispatch, the stdout delivery channel, XSD certification, and cumulative-diff scoping.
- Load [`conventions/`](conventions/index.md) for more information on documentation and terminology conventions — current-state-only docs and the reserved meaning of phase.
- Load [`dev/`](dev/index.md) for more information on the local development loop — dev:serve hot reload, the three concurrent processes, and rebuilding the SPA for serve.
- Load [`devcontainer/`](devcontainer/index.md) for more information on devcontainer environment and t3 agent sandbox setup — Docker networking, port configuration, and t3 desktop connection; read when configuring or troubleshooting the devcontainer.
- Load [`git/`](git/index.md) for more information on Git workflow constraints — commit-message hooks, the pre-commit test gate, attribution rules, and gitignored workspace state.
- Load [`release/`](release/index.md) for more information on releasing and distribution — semantic-release, the npm-tarball vs GitHub-git-tree channels, and the root skills/ release mirror with its release-only sync.
- Load [`serve/`](serve/index.md) for more information on the read-only serve backend — HTTP/JSON API routes, the workspace data model and derivation, and the archive and self-review operations.
- Load [`skills/`](skills/index.md) for more information on the harness-agnostic Agent Skills system — intent-based loading, the skill-scripts root utility, and cross-harness abstraction.
- Load [`testing/`](testing/index.md) for more information on the test strategy — the committed fixture workspace, Vitest node-env limits, and Playwright e2e selectors and flakiness.
- Load [`tooling/`](tooling/index.md) for more information on lint, format, and type-check tooling — the ESLint flat config, Prettier exclusions, and gaps in the lint gate.
- Load [`web/`](web/index.md) for more information on the React + Vite + Tailwind SPA — data layer, screens, routing, and the branding, editor, rendering, styling, and ui subareas.

## Conventions (how we build)
- Open [**Never hand-commit generated skill artifacts in either tree**](practice-never-hand-commit-generated-skill-artifacts.md) to learn about: dist-test is gitignored build output; the root skills/ mirror is tracked but written only by the release sync. .gitattributes and the pre-commit guard cover both trees and the review gate skips them. #build #skills #git #gitattributes #review-gate #generated-artifacts
- Open [**Workspace tracking is project-owned except local configuration and runtime output**](practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md) to learn about: Projects choose whether to track plans and authored workspace files, while init ignores machine-local config.yaml, review artifacts, and runtime output. #gitignore #workspace #documentation #code-review #init
- Open [**Review gate artifacts are git-ignored by a workspace-root .gitignore**](practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md) to learn about: init ships .ai/strikethroo/.gitignore covering plans/*/review/ and archive/*/review/, keeping reviewer output out of git and its own diff. #code-review #gitignore #workspace #init #generated-artifacts
- Open [**Design thesis: configuration is Markdown, guarantees are compiled**](practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled.md) to learn about: Hooks and templates are editable Markdown. Rules a user must not loosen live in TypeScript. #design-thesis #enforcement
- Open [**Keep comment prose terse and single-sourced**](practice-keep-comment-prose-terse-and-single-sourced.md) to learn about: Do not write long doc comments or repeat the same rationale across call sites and file copies. State it once where it belongs. #comments #code-style #documentation #xsd #prose
- Open [**Strikethroo profile packages tolerate inert package-root extras**](practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md) to learn about: validateProfilePackage scopes to profile.yaml plus config/; entries at the package root are accepted and are never copied, hash-tracked, or executed. #profiles #init #validation #security

## Components (what exists)
_None yet._

## By topic

### #init
- Open [**Workspace tracking is project-owned except local configuration and runtime output**](practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md) — Projects choose whether to track plans and authored workspace files, while init ignores machine-local config.yaml, review artifacts, and runtime output.
- Open [**Review gate artifacts are git-ignored by a workspace-root .gitignore**](practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md) — init ships .ai/strikethroo/.gitignore covering plans/*/review/ and archive/*/review/, keeping reviewer output out of git and its own diff.
- Open [**Init refresh: a kept file keeps its old baseline**](cli/practice-init-refresh-kept-file-keeps-its-old-baseline.md) — copyCommonTemplates records the previous hash for a kept config file, so the next refresh asks again.
### #code-review
- Open [**Workspace tracking is project-owned except local configuration and runtime output**](practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md) — Projects choose whether to track plans and authored workspace files, while init ignores machine-local config.yaml, review artifacts, and runtime output.
- Open [**Review gate artifacts are git-ignored by a workspace-root .gitignore**](practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md) — init ships .ai/strikethroo/.gitignore covering plans/*/review/ and archive/*/review/, keeping reviewer output out of git and its own diff.
### #documentation
- Open [**Documentation captures current state only**](conventions/practice-documentation-captures-current-state-only.md) — All docs describe how things work now. No historical context, migration notes, or retired-term mappings.
- Open [**Workspace tracking is project-owned except local configuration and runtime output**](practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md) — Projects choose whether to track plans and authored workspace files, while init ignores machine-local config.yaml, review artifacts, and runtime output.
- Open [**Keep uncommitted workflow identifiers out of public issue and PR text**](git/practice-keep-uncommitted-workflow-identifiers-out-of-public-issue-and-pr-text.md) — Public issues and PRs describe changes without internal plan numbers or references to uncommitted workflow documents.
### #generated-artifacts
- Open [**Never hand-commit generated skill artifacts in either tree**](practice-never-hand-commit-generated-skill-artifacts.md) — dist-test is gitignored build output; the root skills/ mirror is tracked but written only by the release sync. .gitattributes and the pre-commit guard cover both trees and the review gate skips them.
- Open [**Review gate artifacts are git-ignored by a workspace-root .gitignore**](practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md) — init ships .ai/strikethroo/.gitignore covering plans/*/review/ and archive/*/review/, keeping reviewer output out of git and its own diff.
### #gitignore
- Open [**Workspace tracking is project-owned except local configuration and runtime output**](practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md) — Projects choose whether to track plans and authored workspace files, while init ignores machine-local config.yaml, review artifacts, and runtime output.
- Open [**Review gate artifacts are git-ignored by a workspace-root .gitignore**](practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md) — init ships .ai/strikethroo/.gitignore covering plans/*/review/ and archive/*/review/, keeping reviewer output out of git and its own diff.
- Open [**Keep .ai/strikethroo (dogfood workspace) explicitly ignored in .gitignore**](git/practice-keep-ai-strikethroo-dogfood-workspace-explicitly-ignored-in-gitignore.md) — The /.ai/strikethroo path must stay in .gitignore to prevent accidentally committing dogfood workspace state.
### #workspace
- Open [**Workspace tracking is project-owned except local configuration and runtime output**](practice-takes-no-stance-on-committing-the-ai-strikethroo-workspace.md) — Projects choose whether to track plans and authored workspace files, while init ignores machine-local config.yaml, review artifacts, and runtime output.
- Open [**Review gate artifacts are git-ignored by a workspace-root .gitignore**](practice-review-gate-artifacts-are-git-ignored-by-a-workspace-root-gitignore.md) — init ships .ai/strikethroo/.gitignore covering plans/*/review/ and archive/*/review/, keeping reviewer output out of git and its own diff.
- Open [**Keep .ai/strikethroo (dogfood workspace) explicitly ignored in .gitignore**](git/practice-keep-ai-strikethroo-dogfood-workspace-explicitly-ignored-in-gitignore.md) — The /.ai/strikethroo path must stay in .gitignore to prevent accidentally committing dogfood workspace state.
### #build
- Open [**Adding a skill means editing five registries**](skills/practice-adding-a-skill-touches-five-registries.md) — Template, SKILL_ENTRYPOINTS, plugin.json, STRIKETHROO_WORKFLOW_SKILLS, EXPECTED_SKILLS. The mirror test blocks it until release.
- Open [**Use build-time composition to eliminate cross-skill prompt duplication**](skills/prompts/practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication.md) — Shared procedural blocks in SKILL.md files must live as Handlebars partials under src/skill-prompts/_partials/, not copy-pasted per skill.
- Open [**SPA source changes require npm run build:web before serve reflects them**](dev/practice-spa-source-changes-require-npm-run-build-web-before-serve-reflects-them.md) — serve hosts the prebuilt dist-web/ bundle. SPA source changes are not visible until npm run build:web is run; a hard-refresh clears cached content-hashed chunks.
### #code-style
- Open [**Keep comment prose terse and single-sourced**](practice-keep-comment-prose-terse-and-single-sourced.md) — Do not write long doc comments or repeat the same rationale across call sites and file copies. State it once where it belongs.
### #comments
- Open [**Avoid */ inside @theme CSS comments to prevent premature comment termination**](web/styling/practice-avoid-inside-theme-css-comments-to-prevent-premature-comment-termination.md) — A comment containing */ inside a Tailwind @theme block terminates the comment early, producing a cryptic parse error that halts the build.
- Open [**Keep comment prose terse and single-sourced**](practice-keep-comment-prose-terse-and-single-sourced.md) — Do not write long doc comments or repeat the same rationale across call sites and file copies. State it once where it belongs.
### #design-thesis
- Open [**Design thesis: configuration is Markdown, guarantees are compiled**](practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled.md) — Hooks and templates are editable Markdown. Rules a user must not loosen live in TypeScript.
### #enforcement
- Open [**Design thesis: configuration is Markdown, guarantees are compiled**](practice-design-thesis-markdown-is-negotiable-guarantees-are-compiled.md) — Hooks and templates are editable Markdown. Rules a user must not loosen live in TypeScript.
### #git
- Open [**Do not use --no-verify to skip git commit hooks**](git/practice-do-not-use-no-verify-to-skip-git-commit-hooks.md) — Bypassing commit hooks with --no-verify hides real breakage and triggers an approval prompt that halts autonomous runs.
- Open [**Project commit hook rejects AI co-authorship attribution trailers**](git/practice-project-commit-hook-rejects-ai-co-authorship-attribution-trailers.md) — A commit hook rejects Co-Authored-By AI attribution lines; omit them when committing in this repository.
- Open [**Commit subject ≤50 chars; body wrapped at 72 chars (hook enforced)**](git/practice-commit-subject-50-chars-body-wrapped-at-72-chars-hook-enforced.md) — A commit-message hook enforces 50-char subject lines and 72-char body wrapping; violations abort the commit.
### #gitattributes
- Open [**Never hand-commit generated skill artifacts in either tree**](practice-never-hand-commit-generated-skill-artifacts.md) — dist-test is gitignored build output; the root skills/ mirror is tracked but written only by the release sync. .gitattributes and the pre-commit guard cover both trees and the review gate skips them.
### #profiles
- Open [**Strikethroo profile packages tolerate inert package-root extras**](practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md) — validateProfilePackage scopes to profile.yaml plus config/; entries at the package root are accepted and are never copied, hash-tracked, or executed.
### #prose
- Open [**Keep comment prose terse and single-sourced**](practice-keep-comment-prose-terse-and-single-sourced.md) — Do not write long doc comments or repeat the same rationale across call sites and file copies. State it once where it belongs.
### #review-gate
- Open [**An uncertified review is never reported clean**](code-review/practice-uncertified-review-is-never-reported-clean.md) — Only an XSD-certified findings document counts. The orchestrator alone writes review.xml from reviewer stdout.
- Open [**Review gate runs only on explicit opt-in**](code-review/practice-review-gate-runs-only-on-explicit-opt-in.md) — code_review.enabled must be boolean true. Anything else skips before any other check.
- Open [**The review gate reports; it never fixes. Re-run POST_EXECUTION after acting on a finding**](code-review/practice-review-gate-reports-it-does-not-fix.md) — The gate runs once after POST_EXECUTION, records findings, and applies nothing. If you act on a finding, re-run POST_EXECUTION in full before declaring complete.
### #security
- Open [**Serve guards every request; mutations need a session token**](serve/practice-serve-request-security-model.md) — guardRequest checks Host and origin. Mutations need the per-start token from GET /api/session.
- Open [**Route workspace file access through safe-fs**](skills/practice-route-workspace-file-access-through-safe-fs.md) — serve, the CLI, and skill bundles share safe-fs.ts for link-refusing reads and atomic writes.
- Open [**Web routes and API resolve plans by composite {id}--{slug} directory name, not numeric id alone**](serve/practice-web-routes-and-api-resolve-plans-by-composite-id-slug-directory-name-not-numeric.md) — The serve API and SPA router use the composite {id}--{slug} directory name as the routing key. Numeric-only URLs 404. The numeric id is display/sort only.
### #skills
- Open [**Adding a skill means editing five registries**](skills/practice-adding-a-skill-touches-five-registries.md) — Template, SKILL_ENTRYPOINTS, plugin.json, STRIKETHROO_WORKFLOW_SKILLS, EXPECTED_SKILLS. The mirror test blocks it until release.
- Open [**Skills are auto-loaded by intent matching, not slash-command prefix**](skills/map-skills-are-auto-loaded-by-intent-matching-not-slash-command-prefix.md) — Users do not type /st-create-plan; the harness matches the user's intent to the skill description and auto-loads it.
- Open [**Cross-harness code abstraction centralized in ~54 lines across 3 locations**](skills/map-cross-harness-code-abstraction-centralized-in-54-lines-across-3-locations.md) — All harness-specific logic lives in src/types.ts (union type), src/utils.ts (VALID_HARNESSES + getAgentFormat), and src/index.ts (createHarnessStructure). Skills are harness-agnostic.
### #validation
- Open [**Strikethroo profile packages tolerate inert package-root extras**](practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md) — validateProfilePackage scopes to profile.yaml plus config/; entries at the package root are accepted and are never copied, hash-tracked, or executed.
### #xsd
- Open [**Keep comment prose terse and single-sourced**](practice-keep-comment-prose-terse-and-single-sourced.md) — Do not write long doc comments or repeat the same rationale across call sites and file copies. State it once where it belongs.
