# Anthropic 2025 Best Practices for CLAUDE.md - Research Compilation

## Executive Summary

This document compiles comprehensive research on Anthropic's 2025 best practices for Claude Code documentation, focusing on CLAUDE.md structure, workflow optimization, and advanced features. The research covers official guidelines, extended thinking modes, MCP integration opportunities, and specific implementation recommendations for this repository.

## 1. CLAUDE.md Structure Recommendations (2025)

### Core Components

According to Anthropic's official 2025 guidelines, a well-structured CLAUDE.md file should contain these essential components:

**1. Tech Stack Declaration**
- Explicit declaration of project tools and versions
- Example: "Astro 4.5, Tailwind CSS 3.4, TypeScript 5.3"
- Prevents AI from making incorrect assumptions about available tools

**2. Project Structure**
- Outline of key directories and their roles
- Clear mapping of src/components, src/lib, etc.
- Hierarchical organization patterns for complex projects

**3. Commands Section**
- Most important npm, bash, or other scripts
- Building, testing, linting, and deployment commands
- Prevents AI from guessing commands and failing

**4. Code Style & Conventions**
- Explicit formatting guidelines
- Naming conventions and patterns
- Import/export syntax preferences
- Example: "Destructure imports when possible (e.g., import { foo } from 'bar')"

**5. Repository Etiquette**
- Branch naming conventions (feature/TICKET-123-description)
- Commit message formats
- Merge vs. rebase policies

### File Placement and Hierarchy

**Hierarchical Structure:**
- Root level: `/CLAUDE.md` for project-wide configuration
- Directory-specific: `/subdir/CLAUDE.md` for specialized contexts
- Local overrides: `CLAUDE.local.md` (git-ignored) for personal preferences
- Priority: Most nested files take precedence for relevant context

**Memory Management:**
- Project memory: `./CLAUDE.md` - shared with team, version-controlled
- User memory: `~/.claude/CLAUDE.md` - personal preferences
- Working memory: `CLAUDE.local.md` - local, git-ignored for temporary info

### Dynamic Content Management

**Interactive Updates:**
- Use `#` key to give Claude instructions that automatically incorporate into CLAUDE.md
- Document commands, files, and style guidelines during coding
- Include CLAUDE.md changes in commits for team benefit

**Optimization Techniques:**
- Run CLAUDE.md files through prompt improver periodically
- Add emphasis with "IMPORTANT" or "YOU MUST" for critical adherence
- Test and tune instructions based on AI behavior patterns

## 2. Extended Thinking Modes and Workflow Optimization

### Thinking Mode Hierarchy

**Token Allocation System:**
- `think`: 4,000 tokens for routine debugging and basic refactoring
- `think hard`: Intermediate level for moderate complexity
- `think harder`: Advanced level for complex problem-solving  
- `megathink`: 10,000 tokens for architectural decisions
- `ultrathink`: 31,999 tokens for most challenging system design tasks

**Strategic Usage Guidelines:**
- Basic `think` for syntax fixes and simple refactoring
- `megathink` for architectural decisions and complex debugging
- `ultrathink` for system design, performance optimization, and intractable problems
- Processing time: 45-180 seconds for ultrathink, delivers breakthrough solutions

### 2025 Workflow: "Explore, Plan, Code, Commit"

**Four-Step Official Workflow:**
1. **Explore**: Let Claude read files first, avoid immediate coding
2. **Plan**: Use ultrathink to make detailed plans (critical step)
3. **Code**: Write code based on the plan, self-check reasonableness
4. **Commit**: Review and commit changes with proper messages

**Plan Mode Benefits:**
- Extended thinking capabilities for comprehensive strategies
- Use for new features, complex challenges, refactoring projects
- Prevents jumping straight into code without proper analysis

### Performance and Cost Optimization

**Efficiency Strategies:**
- Extended thinking reduces repetitive instructions and corrective prompts
- Well-thought-out plans ensure consistent output from first attempt
- Use `/clear` command frequently between tasks to reset context
- Strategic thinking level allocation based on task complexity

## 3. MCP Integration Opportunities and Documentation Patterns

### Integration Architecture

**Transport Mechanisms:**
- SSE (Server-Sent Events): `claude mcp add --transport sse <name> <url>`
- HTTP: `claude mcp add --transport http <name> <url>`
- Support for real-time connections and standard request/response patterns

**Configuration Hierarchy:**
- Project-scoped: `.mcp.json` (version-controlled, project directory)
- Project-specific: `.claude/settings.local.json` (project directory)
- User-specific: `~/.claude/settings.local.json` (global user settings)

### Available MCP Servers and Use Cases

**Enterprise System Integration:**
- Google Drive, Slack, GitHub integration
- Git, Postgres, Puppeteer automation
- Jira issue tracking and implementation workflows

**Advanced Workflow Examples:**
- "Add the feature described in JIRA issue ENG-4521 and create a PR on GitHub"
- "Check Sentry and Statsig for usage of feature ENG-4521"
- "Find emails of 10 random users who used feature ENG-4521 from Postgres"

### Documentation Patterns

**Automated Documentation Generation:**
- AI-generated documentation with consistent formatting
- Direct integration with Confluence and other platforms
- Real-time updates synchronized with code changes
- Extract meaningful patterns from complex codebases

**Context Management:**
- Output warning threshold: 10,000 tokens for MCP tool outputs
- Use markdown files as checklists and working scratchpads
- Subagent strategies for complex problem investigation

### Security Considerations

**Best Practices:**
- Trust verification for MCP servers before installation
- Careful evaluation of servers that fetch untrusted content
- Prompt injection risk awareness and mitigation
- Secure configuration management for sensitive integrations

## 4. Implementation Guidance for This Repository

### Current State Analysis

The existing `/workspace/CLAUDE.md` file demonstrates many 2025 best practices:
- ✅ Comprehensive command documentation
- ✅ Clear project architecture description
- ✅ Well-defined development workflows
- ✅ Testing philosophy documentation
- ✅ Detailed implementation guidelines

### Recommended Enhancements

#### 1. Tech Stack Declaration (Missing)
**Add to top of CLAUDE.md:**
```markdown
## Tech Stack
- Node.js 18+ with TypeScript 5.3
- Commander.js for CLI argument parsing
- Jest for testing framework
- ESLint + Prettier for code quality
- Chalk for colored terminal output
```

#### 2. Extended Thinking Mode Integration
**Add section:**
```markdown
## Claude Code Thinking Modes

Use appropriate thinking levels for different tasks:
- `think` - Basic debugging, syntax fixes, simple refactoring
- `megathink` - Architecture decisions, complex template processing
- `ultrathink` - System design, major refactoring, performance optimization

Example: "ultrathink: Design a new assistant integration system"
```

#### 3. MCP Integration Opportunities
**Add section:**
```markdown
## MCP Integration Opportunities

This repository can benefit from:
- GitHub integration for issue tracking and PR management
- Git automation for template testing workflows
- CI/CD integration for automated quality checks
- Database integration for usage analytics (future consideration)

Configuration: Store MCP settings in `.claude/settings.local.json`
```

#### 4. Custom Slash Commands Documentation
**Add section:**
```markdown
## Custom Slash Commands

Available commands in `.claude/commands/tasks/`:
- `/tasks:create-plan` - Generate comprehensive project plans
- `/tasks:generate-tasks` - Break down plans into atomic tasks
- `/tasks:execute-blueprint` - Execute specific task implementations

Team members can access these commands after repository clone.
```

#### 5. Workflow Optimization Guidelines
**Add section:**
```markdown
## Workflow Optimization

### Plan-First Development
1. Always start with `ultrathink` planning for complex features
2. Use `/clear` between major task transitions
3. Leverage task management system for complex implementations
4. Apply "Write a Few Tests, Mostly Integration" philosophy

### Context Management
- Use CLAUDE.local.md for temporary working notes
- Include CLAUDE.md updates in commits for team benefit
- Document new patterns and conventions as they emerge
```

#### 6. Quality and Precision Improvements
**Enhance existing sections:**
- Add specific error handling patterns
- Document template variable transformation rules more clearly
- Include troubleshooting guides for common issues
- Add performance benchmarks and optimization targets

### Implementation Priority

**Phase 1 (Immediate):**
- Add Tech Stack Declaration
- Document Extended Thinking Mode usage
- Create Custom Slash Commands section

**Phase 2 (Near-term):**
- Implement MCP integration documentation
- Add Workflow Optimization guidelines
- Enhance precision in existing sections

**Phase 3 (Future):**
- Develop repository-specific MCP servers
- Create automated documentation workflows
- Integrate advanced quality metrics

## 5. Advanced Features and Future Considerations

### Safety and Permissions

**Default Behavior:**
- Conservative approach prioritizing safety
- Permission requests for system-modifying actions
- Customizable allowlists for trusted tools
- Easy-to-undo action preferences (file editing, git commit)

### Team Collaboration Features

**Shared Artifacts:**
- Version-controlled CLAUDE.md files as team documentation
- Shared slash commands in `.claude/commands/`
- Consistent development workflows across team members
- Integration with existing development practices

### CI/CD Integration

**Headless Mode Operations:**
- Script-based prompt execution for automation
- Automated code generation and issue triage
- Hook-based integration with existing pipelines
- Quality gate automation using Claude Code

## Conclusion

The 2025 best practices for Claude Code emphasize structure, clarity, and intelligent workflow optimization. This repository already demonstrates many advanced patterns, particularly in its task management system architecture. The recommended enhancements focus on leveraging extended thinking modes, MCP integration opportunities, and improved documentation precision to create an even more effective development environment.

Key takeaways:
1. CLAUDE.md should be treated as living documentation that evolves with the project
2. Extended thinking modes provide powerful capabilities when matched to appropriate task complexity
3. MCP integration opens opportunities for seamless tool and data source integration
4. Plan-first workflows with proper context management significantly improve AI-assisted development outcomes
5. Team collaboration benefits from shared, version-controlled Claude Code configurations

This research provides a comprehensive foundation for implementing Anthropic's 2025 best practices while preserving the sophisticated task management system already established in this repository.