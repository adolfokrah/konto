# Pre-commit Hooks Setup

This project uses Husky and lint-staged to enforce code quality standards before commits.

## What's Included

### Pre-commit Hook Configuration

The pre-commit hook automatically runs the following checks on staged files:

#### For TypeScript/JavaScript files (`*.{js,jsx,ts,tsx}`):

1. **Prettier formatting** - Automatically formats code
2. **ESLint fixes** - Fixes linting issues where possible
3. **TypeScript type checking** - Ensures no type errors

#### For other files (`*.{json,css,scss,md}`):

1. **Prettier formatting** - Ensures consistent formatting

## Setup

The pre-commit hooks are automatically configured and will run on every commit attempt.

### Manual Commands

You can also run these checks manually:

```bash
# Run pre-commit checks manually
pnpm run pre-commit

# Check formatting without fixing
pnpm run format:check

# Format all files
pnpm run format

# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run type-check

# Format and lint together
pnpm run format:lint
```

## How It Works

1. **Husky** manages Git hooks
2. **lint-staged** runs scripts only on staged files
3. Files are automatically formatted and fixed before commit
4. If there are unfixable errors, the commit is blocked

## Configuration Files

- `.husky/pre-commit` - Pre-commit hook script
- `package.json` - Contains lint-staged configuration
- `.prettierrc.json` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `eslint.config.mjs` - ESLint rules and configuration

## Skipping Hooks (Emergency Only)

If you absolutely need to skip the pre-commit hook:

```bash
git commit -m "emergency fix" --no-verify
```

⚠️ **Use sparingly** - This bypasses all quality checks!
