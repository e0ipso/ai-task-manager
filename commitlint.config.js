const aiTools = [
  'aider',
  'amp',
  'anthropic',
  'chatgpt',
  'claude',
  'codex',
  'copilot',
  'cursor',
  'devin',
  'gemini',
  'jules',
  'openai',
  'opencode',
  'qwen',
  'windsurf',
].join('|');

// Unicode-aware word boundaries, so "Ampère" or "OpenCoder" don't match.
const tool = `(?<![\\p{L}\\p{N}])(?:${aiTools})(?![\\p{L}\\p{N}])`;

const forbiddenPatterns = [
  // Any co-author, human or not.
  /^Co-authored-by:.*/im,
  // Made-with: Cursor, Assisted-by: Claude:claude-opus-5-5, ...
  new RegExp(`^(?:Assisted-by|Generated-by|Made-with|Signed-off-by):.*${tool}`, 'imu'),
  // Tool-specific trailers: Copilot-Session: ..., Amp-Thread: ...
  new RegExp(`^${tool}-[\\w-]+:`, 'imu'),
  // 🤖 Generated with [Claude Code](https://claude.com/claude-code)
  new RegExp(`(?:Generated|Made) (?:with|by|using)\\b.*${tool}`, 'iu'),
];

// Sift ticket IDs point at a private tracker. Built from parts so this file
// doesn't contain one.
const ticketId = new RegExp(['DASH', '-', '\\d{4}'].join(''));

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-ai-generated': parsed => {
          const message = parsed.raw;

          for (const pattern of forbiddenPatterns) {
            const match = message.match(pattern);
            if (match) {
              return [
                false,
                `Commit message contains forbidden AI-generated content: "${match[0]}"`,
              ];
            }
          }

          return [true, ''];
        },
        'no-sift-ticket-ids': parsed => {
          const match = parsed.raw.match(ticketId);
          if (match) {
            return [
              false,
              `Commit message cites a sift ticket ID, which is private: "${match[0]}"`,
            ];
          }

          return [true, ''];
        },
      },
    },
  ],
  rules: {
    // Ensure the commit type is lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Ensure the commit type is not empty
    'type-empty': [2, 'never'],
    // Ensure the commit subject is not empty
    'subject-empty': [2, 'never'],
    // Ensure the commit subject doesn't end with a period
    'subject-full-stop': [2, 'never', '.'],
    // Limit the subject line to 72 characters
    'subject-max-length': [2, 'always', 72],
    // Ensure the commit body has a maximum line length
    'body-max-line-length': [2, 'always', 100],
    // Ensure the commit footer has a maximum line length
    'footer-max-line-length': [2, 'always', 100],
    // Ensure valid commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // A new feature
        'fix', // A bug fix
        'docs', // Documentation only changes
        'style', // Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'perf', // A code change that improves performance
        'test', // Adding missing tests or correcting existing tests
        'build', // Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
        'ci', // Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
        'chore', // Other changes that don't modify src or test files
        'revert', // Reverts a previous commit
      ],
    ],
    // Custom rule to block AI-generated strings
    'no-ai-generated': [2, 'always'],
    'no-sift-ticket-ids': [2, 'always'],
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
