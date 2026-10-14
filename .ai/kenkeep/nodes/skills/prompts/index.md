# kenkeep Index: skills / prompts

↑ Parent: [skills](../index.md)

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
_None._

## Conventions (how we build)
- Open [**Use build-time composition to eliminate cross-skill prompt duplication**](practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication.md) to learn about: Shared procedural blocks in SKILL.md files must live as Handlebars partials under src/skill-prompts/_partials/, not copy-pasted per skill. #build #skill-prompts #architecture
- Open [**Cross-skill disciplines ship as runtime config/shared files**](practice-shared-disciplines-are-runtime-config-not-baked-prompts.md) to learn about: verification-gate, clarification-gate, and anti-rationalization are read at runtime from config/shared/. Adding one is a workspace schema change. #skill-prompts #config-shared #schema-version #verification-gate #lifecycle

## Components (what exists)
- Open [**Skill-prompt build system — src/skill-prompts/ Handlebars source, assembler, shared partials**](map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md) to learn about: src/skill-prompts/skills/<name>/SKILL.md.hbs plus _partials/ are authored source; build-skill-prompts.cjs compiles them with Handlebars into dist-test/<name>/SKILL.md. #build #skill-prompts #source-of-truth #assembler #handlebars

## By topic

### #skill-prompts
- Open [**Use build-time composition to eliminate cross-skill prompt duplication**](practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication.md) — Shared procedural blocks in SKILL.md files must live as Handlebars partials under src/skill-prompts/_partials/, not copy-pasted per skill.
- Open [**Adding a skill means registering it in five places**](../practice-adding-a-skill-touches-five-registries.md) — A new skill needs its .hbs template, SKILL_ENTRYPOINTS entries, plugin.json, STRIKETHROO_WORKFLOW_SKILLS, and the mirror test's EXPECTED_SKILLS.
- Open [**Skill-prompt build system — src/skill-prompts/ Handlebars source, assembler, shared partials**](map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md) — src/skill-prompts/skills/<name>/SKILL.md.hbs plus _partials/ are authored source; build-skill-prompts.cjs compiles them with Handlebars into dist-test/<name>/SKILL.md.
### #build
- Open [**Adding a skill means registering it in five places**](../practice-adding-a-skill-touches-five-registries.md) — A new skill needs its .hbs template, SKILL_ENTRYPOINTS entries, plugin.json, STRIKETHROO_WORKFLOW_SKILLS, and the mirror test's EXPECTED_SKILLS.
- Open [**Use build-time composition to eliminate cross-skill prompt duplication**](practice-use-build-time-composition-to-eliminate-cross-skill-prompt-duplication.md) — Shared procedural blocks in SKILL.md files must live as Handlebars partials under src/skill-prompts/_partials/, not copy-pasted per skill.
- Open [**SPA source changes require npm run build:web before serve reflects them**](../../dev/practice-spa-source-changes-require-npm-run-build-web-before-serve-reflects-them.md) — serve hosts the prebuilt dist-web/ bundle. SPA source changes are not visible until npm run build:web is run; a hard-refresh clears cached content-hashed chunks.
### #architecture
- Open [**Cross-harness code abstraction centralized in ~54 lines across 3 locations**](../map-cross-harness-code-abstraction-centralized-in-54-lines-across-3-locations.md) — All harness-specific logic lives in src/types.ts (union type), src/utils.ts (VALID_HARNESSES + getAgentFormat), and src/index.ts (createHarnessStructure). Skills are harness-agnostic.
- Open [**CLI exposes five thin commands and no plan-management surface**](../map-cli-exposes-only-init-and-serve-commands-all-visualization-management-commands-removed.md) — src/cli.ts registers init, update, export profile, serve, and validate; there are no visualization/management (status, plan) commands.
- Open [**Serve layer uses discriminated-union result types for guarded operations**](../../serve/practice-serve-layer-uses-discriminated-union-result-types-not-custom-error-classes.md) — Archive, config-write, and self-review operations return typed result unions; route handlers map their variants to HTTP responses.
### #assembler
- Open [**Skill-prompt build system — src/skill-prompts/ Handlebars source, assembler, shared partials**](map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md) — src/skill-prompts/skills/<name>/SKILL.md.hbs plus _partials/ are authored source; build-skill-prompts.cjs compiles them with Handlebars into dist-test/<name>/SKILL.md.
### #config-shared
- Open [**Cross-skill disciplines ship as runtime config/shared files**](practice-shared-disciplines-are-runtime-config-not-baked-prompts.md) — verification-gate, clarification-gate, and anti-rationalization are read at runtime from config/shared/. Adding one is a workspace schema change.
### #handlebars
- Open [**Skill-prompt build system — src/skill-prompts/ Handlebars source, assembler, shared partials**](map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md) — src/skill-prompts/skills/<name>/SKILL.md.hbs plus _partials/ are authored source; build-skill-prompts.cjs compiles them with Handlebars into dist-test/<name>/SKILL.md.
### #lifecycle
- Open [**Cross-skill disciplines ship as runtime config/shared files**](practice-shared-disciplines-are-runtime-config-not-baked-prompts.md) — verification-gate, clarification-gate, and anti-rationalization are read at runtime from config/shared/. Adding one is a workspace schema change.
### #schema-version
- Open [**Optional-by-absence pattern: new workspace files do not bump schema version**](../../code-review/practice-optional-by-absence-new-files-absent-means-feature-off.md) — CODE_REVIEW.md and self-review-v2.xsd are both optional by absence; their presence/absence gates the feature. v4 workspaces keep working unchanged.
- Open [**Bump the workspace schema version only for incompatible shape changes**](../../cli/practice-bump-the-workspace-schema-version-only-for-incompatible-shape-changes.md) — CURRENT_WORKSPACE_SCHEMA_VERSION is baked into skill bundles and compared in root.ts; root.ts also hard-codes a test fallback.
- Open [**Resolve plan arguments through _classifyPlanInput and resolvePlan**](../practice-resolve-plans-through-classifyplaninput.md) — shared/plan-resolve.ts classifies input once: absolute path or plan id. Ids stay in the nearest workspace; both routes pass checkWorkspaceSchema.
### #source-of-truth
- Open [**Skill-prompt build system — src/skill-prompts/ Handlebars source, assembler, shared partials**](map-src-skill-prompts-is-the-authored-source-of-truth-for-skill-md-content.md) — src/skill-prompts/skills/<name>/SKILL.md.hbs plus _partials/ are authored source; build-skill-prompts.cjs compiles them with Handlebars into dist-test/<name>/SKILL.md.
### #verification-gate
- Open [**Cross-skill disciplines ship as runtime config/shared files**](practice-shared-disciplines-are-runtime-config-not-baked-prompts.md) — verification-gate, clarification-gate, and anti-rationalization are read at runtime from config/shared/. Adding one is a workspace schema change.