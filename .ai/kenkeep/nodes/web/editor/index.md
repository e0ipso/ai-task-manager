# kenkeep Index: web / editor

↑ Parent: [web](../index.md)

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
_None._

## Conventions (how we build)
- Open [**All CodeMirror packages must stay in devDependencies and be imported lazily**](practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily.md) to learn about: CodeMirror packages are build-time only and must never move to runtime dependencies. All four packages are loaded inside a single React.lazy import boundary. #codemirror #spa #devdependencies #lazy-loading
- Open [**Config editors keep draft, saved baseline, and disk as separate values**](practice-config-editors-keep-draft-baseline-and-disk-apart.md) to learn about: draftState.ts stops a live revalidation from replacing typing. A disk change under unsaved edits shows DiskConflictBanner instead. #web #customize #editor #revalidation #conflicts
- Open [**Customize Config tab: configYaml.ts is the only YAML boundary**](practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa.md) to learn about: configYaml.ts parses and writes config.yaml for the form. Saves keep foreign sections, drop comments, and refuse shapes the form cannot represent. #web #customize #config-yaml #yaml #editor
- Open [**Add lazy-only CodeMirror packages to vite optimizeDeps.include to prevent dev-server MIME errors**](practice-add-lazy-only-codemirror-packages-to-vite-optimizedeps-include-to-prevent-dev-se.md) to learn about: CodeMirror packages reached only through React.lazy are not pre-bundled by Vite; add them to optimizeDeps.include to avoid empty-MIME errors on first navigation to the editor. #vite #codemirror #dev-server #lazy-loading #optimization

## Components (what exists)
- Open [**MarkdownEditor.tsx — code-split CodeMirror 6 markdown editor in Customize detail route**](map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r.md) to learn about: src/web/customize/MarkdownEditor.tsx is a React.lazy-wrapped CodeMirror 6 editor with @codemirror/language-data for lazy fenced-code-block highlighting. #codemirror #spa #customize #editor
- Open [**CustomizeDetailRoute: title appends singular kind (hook or template, not hooks/templates)**](map-customizedetailroute-title-appends-singular-kind-hook-or-template-not-hooks-temp.md) to learn about: The Customize detail page title formats as '<id> hook' or '<id> template'. The breadcrumb still uses the plural kind. #customize #spa #ui

## By topic

### #customize
- Open [**Customize Config tab: configYaml.ts is the only YAML boundary**](practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa.md) — configYaml.ts parses and writes config.yaml for the form. Saves keep foreign sections, drop comments, and refuse shapes the form cannot represent.
- Open [**MarkdownEditor.tsx — code-split CodeMirror 6 markdown editor in Customize detail route**](map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r.md) — src/web/customize/MarkdownEditor.tsx is a React.lazy-wrapped CodeMirror 6 editor with @codemirror/language-data for lazy fenced-code-block highlighting.
- Open [**Config editors keep draft, saved baseline, and disk as separate values**](practice-config-editors-keep-draft-baseline-and-disk-apart.md) — draftState.ts stops a live revalidation from replacing typing. A disk change under unsaved edits shows DiskConflictBanner instead.
### #codemirror
- Open [**All CodeMirror packages must stay in devDependencies and be imported lazily**](practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily.md) — CodeMirror packages are build-time only and must never move to runtime dependencies. All four packages are loaded inside a single React.lazy import boundary.
- Open [**MarkdownEditor.tsx — code-split CodeMirror 6 markdown editor in Customize detail route**](map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r.md) — src/web/customize/MarkdownEditor.tsx is a React.lazy-wrapped CodeMirror 6 editor with @codemirror/language-data for lazy fenced-code-block highlighting.
- Open [**Add lazy-only CodeMirror packages to vite optimizeDeps.include to prevent dev-server MIME errors**](practice-add-lazy-only-codemirror-packages-to-vite-optimizedeps-include-to-prevent-dev-se.md) — CodeMirror packages reached only through React.lazy are not pre-bundled by Vite; add them to optimizeDeps.include to avoid empty-MIME errors on first navigation to the editor.
### #editor
- Open [**Config editors keep draft, saved baseline, and disk as separate values**](practice-config-editors-keep-draft-baseline-and-disk-apart.md) — draftState.ts stops a live revalidation from replacing typing. A disk change under unsaved edits shows DiskConflictBanner instead.
- Open [**Customize Config tab: configYaml.ts is the only YAML boundary**](practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa.md) — configYaml.ts parses and writes config.yaml for the form. Saves keep foreign sections, drop comments, and refuse shapes the form cannot represent.
- Open [**MarkdownEditor.tsx — code-split CodeMirror 6 markdown editor in Customize detail route**](map-markdowneditor-tsx-code-split-codemirror-6-markdown-editor-in-customize-detail-r.md) — src/web/customize/MarkdownEditor.tsx is a React.lazy-wrapped CodeMirror 6 editor with @codemirror/language-data for lazy fenced-code-block highlighting.
### #spa
- Open [**Plan Detail: blueprint markdown section is distinct from the tasks-frontmatter Tasks tab**](../../serve/practice-plan-detail-blueprint-markdown-vs-tasks-frontmatter.md) — Four data sources feed the Plan Detail tabs; the blueprint prose and tasks-frontmatter rendering must not be conflated
- Open [**serve UI PRD and tickets live under .ai/strikethroo/scratch/ui/**](../../serve/map-serve-ui-prd-and-tickets-live-under-ai-strikethroo-scratch-ui.md) — The PRD and 13 dependency-ordered tickets for the serve SPA feature are in .ai/strikethroo/scratch/ui/, not in the formal plans/ flow.
- Open [**Serve SPA has two sanctioned workspace mutations; self-review writes nothing**](../../serve/practice-serve-layer-mutation-invariant-archive-endpoint-is-the-only-route-that-writes-workspace-files.md) — Archive moves done plans into archive/. Config writes overwrite one existing allowlisted file. Self-review spawns a process but writes no files.
### #lazy-loading
- Open [**All CodeMirror packages must stay in devDependencies and be imported lazily**](practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily.md) — CodeMirror packages are build-time only and must never move to runtime dependencies. All four packages are loaded inside a single React.lazy import boundary.
- Open [**Add lazy-only CodeMirror packages to vite optimizeDeps.include to prevent dev-server MIME errors**](practice-add-lazy-only-codemirror-packages-to-vite-optimizedeps-include-to-prevent-dev-se.md) — CodeMirror packages reached only through React.lazy are not pre-bundled by Vite; add them to optimizeDeps.include to avoid empty-MIME errors on first navigation to the editor.
### #web
- Open [**Plan Detail: blueprint markdown section is distinct from the tasks-frontmatter Tasks tab**](../../serve/practice-plan-detail-blueprint-markdown-vs-tasks-frontmatter.md) — Four data sources feed the Plan Detail tabs; the blueprint prose and tasks-frontmatter rendering must not be conflated
- Open [**serve UI PRD and tickets live under .ai/strikethroo/scratch/ui/**](../../serve/map-serve-ui-prd-and-tickets-live-under-ai-strikethroo-scratch-ui.md) — The PRD and 13 dependency-ordered tickets for the serve SPA feature are in .ai/strikethroo/scratch/ui/, not in the formal plans/ flow.
- Open [**Hot-reload dev loop requires three concurrent processes**](../../dev/practice-hot-reload-dev-loop-requires-three-concurrent-processes.md) — Backend: ts-node via node --watch. Frontend: Vite at localhost:5173 with /api/* proxied to localhost:4317. No dist/ involvement.
### #config-yaml
- Open [**An empty config.yaml means nothing is configured, in every reader**](../../skills/practice-empty-config-yaml-means-nothing-configured-in-every-reader.md) — Absent, blank, or comment-only config.yaml is unconfigured everywhere via hasYamlContent. The SPA mirrors it. Malformed YAML is an error.
- Open [**Customize Config tab: configYaml.ts is the only YAML boundary**](practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa.md) — configYaml.ts parses and writes config.yaml for the form. Saves keep foreign sections, drop comments, and refuse shapes the form cannot represent.
- Open [**Harness cli_args are exact local strings and executable authority**](../../skills/practice-harness-cli-args-are-exact-local-strings-and-executable-authority.md) — cli_args are kept byte-for-byte, spawned with shell:false, shared by task, review, and readiness. They, hooks, and the selector run unsandboxed.
### #conflicts
- Open [**Init refresh decides each config path against its recorded baseline**](../../cli/practice-init-refresh-decides-each-config-path-against-its-recorded-baseline.md) — One outcome per config/ path, kept edits keep the old baseline, no trusted metadata means {} and every differing file conflicts.
- Open [**Config editors keep draft, saved baseline, and disk as separate values**](practice-config-editors-keep-draft-baseline-and-disk-apart.md) — draftState.ts stops a live revalidation from replacing typing. A disk change under unsaved edits shows DiskConflictBanner instead.
### #dev-server
- Open [**Add lazy-only CodeMirror packages to vite optimizeDeps.include to prevent dev-server MIME errors**](practice-add-lazy-only-codemirror-packages-to-vite-optimizedeps-include-to-prevent-dev-se.md) — CodeMirror packages reached only through React.lazy are not pre-bundled by Vite; add them to optimizeDeps.include to avoid empty-MIME errors on first navigation to the editor.
### #devdependencies
- Open [**All CodeMirror packages must stay in devDependencies and be imported lazily**](practice-all-codemirror-packages-must-stay-in-devdependencies-and-be-imported-lazily.md) — CodeMirror packages are build-time only and must never move to runtime dependencies. All four packages are loaded inside a single React.lazy import boundary.
- Open [**Frontend libraries stay in devDependencies; js-yaml stays in dependencies**](../../tooling/practice-frontend-libraries-in-devdependencies-js-yaml-in-dependencies.md) — serve ships prebuilt dist-web/, so SPA libraries are build-only. tsc emits profiles.ts unbundled, so js-yaml must stay a runtime dependency.
### #optimization
- Open [**Add lazy-only CodeMirror packages to vite optimizeDeps.include to prevent dev-server MIME errors**](practice-add-lazy-only-codemirror-packages-to-vite-optimizedeps-include-to-prevent-dev-se.md) — CodeMirror packages reached only through React.lazy are not pre-bundled by Vite; add them to optimizeDeps.include to avoid empty-MIME errors on first navigation to the editor.
### #revalidation
- Open [**Config editors keep draft, saved baseline, and disk as separate values**](practice-config-editors-keep-draft-baseline-and-disk-apart.md) — draftState.ts stops a live revalidation from replacing typing. A disk change under unsaved edits shows DiskConflictBanner instead.
- Open [**SPA data layer: one plans fetch, data kept on failed re-reads, safe routing**](../practice-spa-data-layer-shared-plans-resource-and-revalidation.md) — PlansProvider owns the one /api/plans fetch; useResource keeps last good data on a failed re-read; an SSE reconnect forces one pass.
### #ui
- Open [**Archive UI control — confirmation-gated Archive button on done plans**](../ui/map-archive-ui-control-confirmation-gated-archive-button-on-done-plans.md) — Done plans get an Archive button wired to ArchivePlanModal; POST /api/plans/:id/archive triggers SSE-driven UI refresh.
- Open [**Convey done/undone state with strikethrough, color, or emoji — never a non-interactive checkbox**](../ui/practice-convey-done-state-with-strikethrough-color-or-emoji-not-non-interactive-checkboxes.md) — In read-only UI, render Done/Undone with a passive visual cue (strikethrough, text color, emoji); a checkbox implies it is clickable
- Open [**CustomizeDetailRoute: title appends singular kind (hook or template, not hooks/templates)**](map-customizedetailroute-title-appends-singular-kind-hook-or-template-not-hooks-temp.md) — The Customize detail page title formats as '<id> hook' or '<id> template'. The breadcrumb still uses the plural kind.
### #vite
- Open [**Add lazy-only CodeMirror packages to vite optimizeDeps.include to prevent dev-server MIME errors**](practice-add-lazy-only-codemirror-packages-to-vite-optimizedeps-include-to-prevent-dev-se.md) — CodeMirror packages reached only through React.lazy are not pre-bundled by Vite; add them to optimizeDeps.include to avoid empty-MIME errors on first navigation to the editor.
### #yaml
- Open [**Customize Config tab: configYaml.ts is the only YAML boundary**](practice-config-yaml-form-is-the-only-yaml-boundary-in-the-spa.md) — configYaml.ts parses and writes config.yaml for the form. Saves keep foreign sections, drop comments, and refuse shapes the form cannot represent.