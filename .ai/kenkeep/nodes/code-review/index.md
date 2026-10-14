# kenkeep Index: code-review

↑ Parent: [kenkeep](../index.md)

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
_None._

## Conventions (how we build)
- Open [**The review gate reports; it never fixes. Re-run POST_EXECUTION after acting on a finding**](practice-review-gate-reports-it-does-not-fix.md) to learn about: The gate runs once after POST_EXECUTION, records findings, and applies nothing. If you act on a finding, re-run POST_EXECUTION in full before declaring complete. #review-gate #ordering #mechanical-gates #report-only
- Open [**Optional-by-absence pattern: new workspace files do not bump schema version**](practice-optional-by-absence-new-files-absent-means-feature-off.md) to learn about: CODE_REVIEW.md and self-review-v2.xsd are both optional by absence; their presence/absence gates the feature. v4 workspaces keep working unchanged. #schema-version #compatibility #optional-gates
- Open [**The reviewer prints findings; only the orchestrator writes review.xml**](practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them.md) to learn about: Stdout between per-dispatch token delimiters is the one findings channel. Anti-echo guard, stale-file removal, and no certification on nonzero exit. #review-gate #delivery #stdout #certification
- Open [**Review certification accepts only XSD syntax and an xmllint-confirmed count**](practice-review-certification-accepts-only-xsd-syntax-and-a-confirmed-count.md) to learn about: DTD declarations are refused before validation, xmllint never expands entities, and the tag scanner's count must match xmllint --xpath. #review-gate #certification #xmllint #xml-security
- Open [**Review diff Git calls are argv-only, and a lost path fails the gate**](practice-review-diff-git-calls-are-argv-only-and-a-lost-path-fails-the-gate.md) to learn about: execGit runs git with no shell and NUL-split listings. Any failed step makes _readCumulativeDiff null, an infrastructure failure, not a smaller scope. #review-gate #git #diff-scope #shell-safety
- Open [**The review gate runs only when code_review.enabled is boolean true**](practice-review-gate-runs-only-on-explicit-boolean-opt-in.md) to learn about: Absent, false, or missing config skips as review-disabled before any schema, hook, validator, or discovery work. Invalid config fails. #review-gate #opt-in #configuration #activation

## Components (what exists)
- Open [**Model-optional dispatch: reviewer harness omits --model to use CLI defaults**](map-model-optional-dispatch-reviewer-harness-omits-model.md) to learn about: Harness discovery yields a harness, not a model id. Reviewer dispatch omits \`--model\`; execution_routing dispatch still requires it. Harness probes work the same way for the same reason. #dispatch #harness-discovery #model-selection

## By topic

### #review-gate
- Open [**The reviewer prints findings; only the orchestrator writes review.xml**](practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them.md) — Stdout between per-dispatch token delimiters is the one findings channel. Anti-echo guard, stale-file removal, and no certification on nonzero exit.
- Open [**Review certification accepts only XSD syntax and an xmllint-confirmed count**](practice-review-certification-accepts-only-xsd-syntax-and-a-confirmed-count.md) — DTD declarations are refused before validation, xmllint never expands entities, and the tag scanner's count must match xmllint --xpath.
- Open [**Review diff Git calls are argv-only, and a lost path fails the gate**](practice-review-diff-git-calls-are-argv-only-and-a-lost-path-fails-the-gate.md) — execGit runs git with no shell and NUL-split listings. Any failed step makes _readCumulativeDiff null, an infrastructure failure, not a smaller scope.
### #certification
- Open [**The reviewer prints findings; only the orchestrator writes review.xml**](practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them.md) — Stdout between per-dispatch token delimiters is the one findings channel. Anti-echo guard, stale-file removal, and no certification on nonzero exit.
- Open [**Review certification accepts only XSD syntax and an xmllint-confirmed count**](practice-review-certification-accepts-only-xsd-syntax-and-a-confirmed-count.md) — DTD declarations are refused before validation, xmllint never expands entities, and the tag scanner's count must match xmllint --xpath.
### #activation
- Open [**The review gate runs only when code_review.enabled is boolean true**](practice-review-gate-runs-only-on-explicit-boolean-opt-in.md) — Absent, false, or missing config skips as review-disabled before any schema, hook, validator, or discovery work. Invalid config fails.
### #compatibility
- Open [**Optional-by-absence pattern: new workspace files do not bump schema version**](practice-optional-by-absence-new-files-absent-means-feature-off.md) — CODE_REVIEW.md and self-review-v2.xsd are both optional by absence; their presence/absence gates the feature. v4 workspaces keep working unchanged.
- Open [**Bump the workspace schema version only for incompatible shape changes**](../cli/practice-bump-the-workspace-schema-version-only-for-incompatible-shape-changes.md) — CURRENT_WORKSPACE_SCHEMA_VERSION is baked into skill bundles and compared in root.ts; root.ts also hard-codes a test fallback.
### #configuration
- Open [**The review gate runs only when code_review.enabled is boolean true**](practice-review-gate-runs-only-on-explicit-boolean-opt-in.md) — Absent, false, or missing config skips as review-disabled before any schema, hook, validator, or discovery work. Invalid config fails.
### #delivery
- Open [**The reviewer prints findings; only the orchestrator writes review.xml**](practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them.md) — Stdout between per-dispatch token delimiters is the one findings channel. Anti-echo guard, stale-file removal, and no certification on nonzero exit.
### #diff-scope
- Open [**Review diff Git calls are argv-only, and a lost path fails the gate**](practice-review-diff-git-calls-are-argv-only-and-a-lost-path-fails-the-gate.md) — execGit runs git with no shell and NUL-split listings. Any failed step makes _readCumulativeDiff null, an infrastructure failure, not a smaller scope.
### #dispatch
- Open [**Task routing classifies at generation and selects a target at dispatch**](../skills/practice-task-routing-classifies-at-generation-and-selects-at-dispatch.md) — route-task-execution.cjs alone writes execution_profile. dispatch-task-execution.cjs picks a target, rejects bad frontmatter with exit 2.
- Open [**Auth probe deadline and the single executable resolver**](../skills/map-auth-probe-deadline-and-the-single-executable-resolver.md) — prepareLaunch bounds only the auth probe with a compiled constant. resolveExecutablePath is the one resolver; self-review.ts keeps its own scan.
- Open [**Harness cli_args are exact local strings and executable authority**](../skills/practice-harness-cli-args-are-exact-local-strings-and-executable-authority.md) — cli_args are kept byte-for-byte, spawned with shell:false, shared by task, review, and readiness. They, hooks, and the selector run unsandboxed.
### #git
- Open [**Do not use --no-verify to skip git commit hooks**](../git/practice-do-not-use-no-verify-to-skip-git-commit-hooks.md) — Bypassing commit hooks with --no-verify hides real breakage and triggers an approval prompt that halts autonomous runs.
- Open [**Project commit hook rejects AI co-authorship attribution trailers**](../git/practice-project-commit-hook-rejects-ai-co-authorship-attribution-trailers.md) — A commit hook rejects Co-Authored-By AI attribution lines; omit them when committing in this repository.
- Open [**Commit subject ≤50 chars; body wrapped at 72 chars (hook enforced)**](../git/practice-commit-subject-50-chars-body-wrapped-at-72-chars-hook-enforced.md) — A commit-message hook enforces 50-char subject lines and 72-char body wrapping; violations abort the commit.
### #harness-discovery
- Open [**Model-optional dispatch: reviewer harness omits --model to use CLI defaults**](map-model-optional-dispatch-reviewer-harness-omits-model.md) — Harness discovery yields a harness, not a model id. Reviewer dispatch omits \`--model\`; execution_routing dispatch still requires it. Harness probes work the same way for the same reason.
### #mechanical-gates
- Open [**The review gate reports; it never fixes. Re-run POST_EXECUTION after acting on a finding**](practice-review-gate-reports-it-does-not-fix.md) — The gate runs once after POST_EXECUTION, records findings, and applies nothing. If you act on a finding, re-run POST_EXECUTION in full before declaring complete.
### #model-selection
- Open [**Model-optional dispatch: reviewer harness omits --model to use CLI defaults**](map-model-optional-dispatch-reviewer-harness-omits-model.md) — Harness discovery yields a harness, not a model id. Reviewer dispatch omits \`--model\`; execution_routing dispatch still requires it. Harness probes work the same way for the same reason.
### #opt-in
- Open [**The review gate runs only when code_review.enabled is boolean true**](practice-review-gate-runs-only-on-explicit-boolean-opt-in.md) — Absent, false, or missing config skips as review-disabled before any schema, hook, validator, or discovery work. Invalid config fails.
### #optional-gates
- Open [**Optional-by-absence pattern: new workspace files do not bump schema version**](practice-optional-by-absence-new-files-absent-means-feature-off.md) — CODE_REVIEW.md and self-review-v2.xsd are both optional by absence; their presence/absence gates the feature. v4 workspaces keep working unchanged.
- Open [**validate's metadata gate reports deleted files, never hash drift**](../cli/practice-validate-metadata-gate-reports-deleted-files-never-hash-drift.md) — A changed hash is a user edit that init protects, so it is not a finding; OPTIONAL_BY_ABSENCE lists files whose absence is valid.
### #ordering
- Open [**The review gate reports; it never fixes. Re-run POST_EXECUTION after acting on a finding**](practice-review-gate-reports-it-does-not-fix.md) — The gate runs once after POST_EXECUTION, records findings, and applies nothing. If you act on a finding, re-run POST_EXECUTION in full before declaring complete.
### #report-only
- Open [**The review gate reports; it never fixes. Re-run POST_EXECUTION after acting on a finding**](practice-review-gate-reports-it-does-not-fix.md) — The gate runs once after POST_EXECUTION, records findings, and applies nothing. If you act on a finding, re-run POST_EXECUTION in full before declaring complete.
### #schema-version
- Open [**Optional-by-absence pattern: new workspace files do not bump schema version**](practice-optional-by-absence-new-files-absent-means-feature-off.md) — CODE_REVIEW.md and self-review-v2.xsd are both optional by absence; their presence/absence gates the feature. v4 workspaces keep working unchanged.
- Open [**Bump the workspace schema version only for incompatible shape changes**](../cli/practice-bump-the-workspace-schema-version-only-for-incompatible-shape-changes.md) — CURRENT_WORKSPACE_SCHEMA_VERSION is baked into skill bundles and compared in root.ts; root.ts also hard-codes a test fallback.
- Open [**Resolve plan arguments through _classifyPlanInput and resolvePlan**](../skills/practice-resolve-plans-through-classifyplaninput.md) — shared/plan-resolve.ts classifies input once: absolute path or plan id. Ids stay in the nearest workspace; both routes pass checkWorkspaceSchema.
### #shell-safety
- Open [**Review diff Git calls are argv-only, and a lost path fails the gate**](practice-review-diff-git-calls-are-argv-only-and-a-lost-path-fails-the-gate.md) — execGit runs git with no shell and NUL-split listings. Any failed step makes _readCumulativeDiff null, an infrastructure failure, not a smaller scope.
### #stdout
- Open [**The reviewer prints findings; only the orchestrator writes review.xml**](practice-reviewer-prints-findings-and-the-orchestrator-alone-writes-them.md) — Stdout between per-dispatch token delimiters is the one findings channel. Anti-echo guard, stale-file removal, and no certification on nonzero exit.
### #xml-security
- Open [**Review certification accepts only XSD syntax and an xmllint-confirmed count**](practice-review-certification-accepts-only-xsd-syntax-and-a-confirmed-count.md) — DTD declarations are refused before validation, xmllint never expands entities, and the tag scanner's count must match xmllint --xpath.
### #xmllint
- Open [**Review certification accepts only XSD syntax and an xmllint-confirmed count**](practice-review-certification-accepts-only-xsd-syntax-and-a-confirmed-count.md) — DTD declarations are refused before validation, xmllint never expands entities, and the tag scanner's count must match xmllint --xpath.