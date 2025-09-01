# AI Task Manager

AI-powered task management CLI tool built with TypeScript and Node.js.

## Installation

### NPX (Recommended)
```bash
npx @e0ipso/ai-task-manager --help
```

### Global Installation
```bash
npm install -g @e0ipso/ai-task-manager
ai-task-manager --help
```

## Usage

### Initialize a workspace
```bash
ai-task-manager init
```

### Create a task
```bash
ai-task-manager create --title "My Task" --description "Task description"
```

### List tasks
```bash
ai-task-manager list
ai-task-manager list --status pending
```

### View workspace status
```bash
ai-task-manager status
```

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Lint and Format
```bash
npm run lint
npm run format
```

## License

MIT