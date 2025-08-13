# Git Hooks Setup with Lefthook

This project uses **Lefthook** for Git hooks - a fast, universal Git hooks manager that replaces Husky and works with any programming language.

## 🚀 **Migration from Husky**

✅ **Husky Removed**: Old `.husky/` directory and `lint-staged` configuration removed  
✅ **Lefthook Active**: New, faster Git hooks system now in place  
✅ **Multi-language Support**: Handles both Flutter/Dart and TypeScript code

## 🪝 What's Configured

### Pre-commit Hooks:
- **Dart Formatting**: Auto-formats Dart code using `dart format`
- **Flutter Analyze**: Runs Flutter linter to catch issues
- **TypeScript Formatting**: Formats TypeScript/JavaScript files in CMS
- **ESLint**: Lints TypeScript/JavaScript code in CMS

### Pre-push Hooks:
- **Flutter Tests**: Runs unit tests before push
- **CMS Tests**: Runs backend tests before push  
- **TypeScript Type Check**: Validates TypeScript types

## 🚀 Installation

Lefthook is already installed and configured! The hooks are automatically active.

## 📝 Commands

```bash
# Run pre-commit hooks manually
lefthook run pre-commit

# Run pre-push hooks manually  
lefthook run pre-push

# Install/reinstall hooks
lefthook install

# Run specific hook
lefthook run dart-format
```

## ⚙️ Configuration

The configuration is in `lefthook.yml` at the project root. You can:

- Skip hooks: `git commit --no-verify`
- Modify hook behavior in `lefthook.yml`
- Add new hooks for additional validation

## 🔧 Features

- **Parallel Execution**: Multiple hooks run simultaneously for speed
- **File Filtering**: Hooks only run on relevant files
- **Auto-fixing**: Some hooks automatically fix issues and stage changes
- **Skip Conditions**: Hooks skip during merge/rebase operations

## 🎯 Benefits

- ✅ Consistent code formatting across the team
- ✅ Catch linting issues before commit
- ✅ Prevent broken code from being pushed
- ✅ Faster than running tests manually
- ✅ Works with both Flutter and TypeScript codebases

Your code will now be automatically formatted and validated on every commit! 🎉
