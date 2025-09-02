module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-ai-generated': parsed => {
          const message = parsed.raw;

          const forbiddenStrings = [
            '🤖 Generated with [Claude Code](https://claude.ai/code)',
            'Co-Authored-By: Claude <noreply@anthropic.com>',
          ];

          for (const forbiddenString of forbiddenStrings) {
            if (message.includes(forbiddenString)) {
              return [
                false,
                `Commit message contains forbidden AI-generated content: "${forbiddenString}"`,
              ];
            }
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
    // Ensure the commit subject is lowercase
    'subject-case': [2, 'always', 'lower-case'],
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
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
