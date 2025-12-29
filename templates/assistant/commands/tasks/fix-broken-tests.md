---
argument-hint: "[testCommand]"
description: Fix the tests your task execution broke.
---
## Assistant Configuration

Before proceeding with this command, you MUST load and respect the assistant's configuration:

Load the following configuration files in order of precedence (later files override earlier ones):
1. `/workspace/AGENTS.md` - Project-level task management guidance
2. `/workspace/CLAUDE.md` - Claude-specific assistant configuration (if it exists)
3. `/home/node/.claude/CLAUDE.md` - Global Claude configuration from your home directory (if it exists)

These files contain your global and project-level configuration rules. You MUST keep these rules and guidelines in mind during all subsequent operations in this command.

---

Fix all failing tests in this repository. Think harder and use tools.

Execute this command to run the tests:

<test-command>
$1
</test-command>

If the test command is empty, read CLAUDE.md for test execution instructions.

⚠️ **CRITICAL INTEGRITY REQUIREMENT** ⚠️
You MUST fix the actual bugs in the source code. Green tests are worthless if achieved through cheating.

**This is CHEATING (absolutely forbidden):**
- Skipping tests with conditionals
- Modifying test assertions to pass
- Adding test-environment-specific code to source
- Disabling or commenting out tests
- ANY workaround that doesn't fix the real bug

**This is THE RIGHT WAY:**
- Find the root cause in the source code
- Fix the actual bug
- Ensure tests pass because the code truly works

**Process:**
1. Run all tests to identify failures
2. Fix EVERY failing test iteratively
3. Verify all tests pass legitimately

DO NOT STOP after fixing some tests - fix ALL of them.

Remember: The entire point of tests is to ensure code robustness. If you cheat in ANY way, the tests become meaningless and I cannot trust that the code actually works.

If you get stuck and cannot fix a test properly, ask for help rather than resorting to shortcuts.
