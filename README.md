# AI Task Manager

AI-powered task management CLI tool built with TypeScript and Node.js. Supports multiple coding assistants including Claude and Gemini for comprehensive development workflow integration.

## Features

- **Multi-Assistant Support**: Configure support for Claude, Gemini, or both assistants simultaneously
- **Intelligent Directory Structure**: Organized file structure with assistant-specific directories
- **Interactive CLI**: Enhanced user interface with colored output and progress indicators
- **Template System**: Built-in templates for different project types (basic, development, research)
- **Task Management**: Create, list, and manage tasks with status tracking
- **Installation Management**: Comprehensive installation, verification, and repair capabilities
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Start

### Installation
```bash
# Install globally
npm install -g @e0ipso/ai-task-manager

# Or use with npx (no installation required)
npx @e0ipso/ai-task-manager --help
```

### Initialize a New Workspace

The `--assistants` flag is **required** when initializing a workspace. You must specify which coding assistant(s) you want to configure support for.

```bash
# Quick start with Claude
npx @e0ipso/ai-task-manager init --assistants claude --non-interactive

# Interactive setup with project details
npx @e0ipso/ai-task-manager init --assistants claude --project "My App" --description "A web application"
```

## Assistant Selection

AI Task Manager supports multiple coding assistants. You **must** specify which assistant(s) to use during initialization using the `--assistants` flag.

### Supported Assistants

- **Claude**: Anthropic's Claude AI assistant
- **Gemini**: Google's Gemini AI assistant

### Single Assistant Setup

```bash
# Claude only
npx @e0ipso/ai-task-manager init --assistants claude --project "My App"

# Gemini only  
npx @e0ipso/ai-task-manager init --assistants gemini --project "My App"
```

### Multiple Assistant Setup

```bash
# Both Claude and Gemini
npx @e0ipso/ai-task-manager init --assistants claude,gemini --project "My App"
```

### Directory Structure

When you initialize with assistant selection, the following directory structure is created:

```
project-root/
├── .ai/
│   ├── claude/              # Claude-specific files (if selected)
│   │   ├── commands/         # Claude command files
│   │   ├── tasks/           # Claude task templates
│   │   └── config/          # Claude configuration
│   ├── gemini/              # Gemini-specific files (if selected)
│   │   ├── commands/         # Gemini command files
│   │   ├── tasks/           # Gemini task templates
│   │   └── config/          # Gemini configuration
│   └── shared/              # Shared templates and resources
├── .ai-tasks/               # Core task management files
│   ├── config.json          # Workspace configuration
│   ├── tasks.json           # Task database
│   └── templates/           # Project templates
└── project files...
```

### Installation Behavior

- **Single Assistant**: Commands and templates are installed only to the selected assistant's directory
- **Multiple Assistants**: Commands and templates are duplicated to all selected assistant directories
- **Directory Creation**: All necessary directories are created automatically during initialization
- **File Organization**: Each assistant maintains its own isolated command and task structure

## Usage Examples

### Complete Initialization Examples

```bash
# Minimal setup with Claude
npx @e0ipso/ai-task-manager init --assistants claude

# Full setup with both assistants
npx @e0ipso/ai-task-manager init \
  --assistants claude,gemini \
  --project "E-commerce Platform" \
  --description "Full-stack web application" \
  --template development

# Non-interactive setup with overwrite protection
npx @e0ipso/ai-task-manager init \
  --assistants gemini \
  --project "Data Analysis" \
  --non-interactive \
  --force

# Dry run to preview changes
npx @e0ipso/ai-task-manager init \
  --assistants claude,gemini \
  --project "Test Project" \
  --dry-run \
  --verbose
```

### Task Management

```bash
# Create a new task
ai-task-manager create --title "Fix login bug" --description "Fix authentication issue"

# List all tasks
ai-task-manager list

# List tasks by status
ai-task-manager list --status pending
ai-task-manager list --status in_progress
ai-task-manager list --status completed

# Check workspace status
ai-task-manager status
```

### Installation Management

```bash
# Install AI Task Manager components
ai-task-manager install

# Verify installation integrity
ai-task-manager verify

# Repair damaged installation
ai-task-manager verify --repair

# Uninstall (with confirmation)
ai-task-manager uninstall
```

## Troubleshooting

### Common Issues and Solutions

#### Missing `--assistants` Flag

**Error**: `error: required option '--assistants <assistants>' not specified`

**Solution**: The `--assistants` flag is mandatory. Specify one or more assistants:
```bash
npx @e0ipso/ai-task-manager init --assistants claude
npx @e0ipso/ai-task-manager init --assistants claude,gemini
```

#### Invalid Assistant Names

**Error**: `Invalid assistant name: xyz. Supported assistants: claude, gemini`

**Solution**: Use only supported assistant names. Common corrections:
- `claud` → `claude`
- `anthropic` → `claude`
- `claude-ai` → `claude`
- `gemeni` → `gemini`
- `google` → `gemini`
- `bard` → `gemini`

#### Permission Errors

**Error**: File system permission errors during initialization

**Solutions**:
- Ensure you have write permissions to the target directory
- On Unix systems, check directory ownership: `ls -la`
- Try running with appropriate permissions or in a user-owned directory

#### Existing Installation Conflicts

**Error**: Installation conflicts with existing files

**Solutions**:
```bash
# Force overwrite existing installation
ai-task-manager init --assistants claude --force

# Preview changes without making them
ai-task-manager init --assistants claude --dry-run

# Use different overwrite mode
ai-task-manager install --overwrite-mode skip
```

#### Directory Not Found

**Error**: Target directory doesn't exist or isn't accessible

**Solutions**:
- Ensure you're in the correct project directory
- Create the directory first: `mkdir my-project && cd my-project`
- Check directory path and permissions

### Advanced Troubleshooting

#### Enable Verbose Output

For detailed debugging information:
```bash
npx @e0ipso/ai-task-manager init --assistants claude --verbose
```

#### Verify Installation Health

```bash
# Check installation status
ai-task-manager verify

# Get detailed status in JSON format
ai-task-manager status --format json
```

#### Reset Installation

If you need to completely reset:
```bash
# Remove existing installation
ai-task-manager uninstall --force

# Reinstall from scratch
ai-task-manager install

# Re-initialize workspace
npx @e0ipso/ai-task-manager init --assistants claude,gemini --force
```

## Command Reference

### Global Options

- `--no-color`: Disable colored output
- `--help`: Show help information
- `--version`: Show version number

### `init` Command

Initialize a new AI Task Manager workspace.

**Required Options:**
- `--assistants <assistants>`: Select coding assistants (claude,gemini)

**Optional Options:**
- `--project <name>`: Project name
- `--description <desc>`: Project description  
- `--template <template>`: Project template (basic, development, research, custom)
- `--no-examples`: Skip including example tasks
- `--non-interactive`: Skip interactive prompts and use defaults
- `--force`: Overwrite existing workspace if it exists
- `--dry-run`: Preview initialization without making changes
- `--verbose`: Enable detailed logging output

### Other Commands

- `install`: Install AI Task Manager components
- `verify [--repair]`: Verify and optionally repair installation
- `uninstall [--force]`: Remove AI Task Manager installation
- `create`: Create a new task
- `list [--status <status>] [--format <format>]`: List tasks
- `status [--format <format>]`: Show workspace status

### Build
```bash
npm run build
```

### Test
```bash
npm test
npm run test:watch
```

### Development Mode
```bash
npm run dev  # Watch mode for development
```

### Lint and Format
```bash
npm run lint
npm run lint:fix
npm run format
```

### Clean Build
```bash
npm run clean
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## Support

- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/e0ipso/ai-task-manager/issues)
- **Documentation**: Full documentation available in the repository
- **Community**: Join discussions in the repository's Discussions tab

## Changelog

### v0.1.0
- Initial release with multi-assistant support
- Claude and Gemini integration
- Comprehensive CLI interface
- Task management system
- Template-based initialization
- Installation verification and repair tools

## License

Proprietary Software with Revocation Rights.

This software is free to use, run, and operate for any lawful purposes. The
author can revoke the license to use it at any time and by any reason. A license
revocation notice may be provided through:

- Direct communication to known users
- Public announcement on the project repository
- Update to the LICENSE file
