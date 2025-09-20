# Vitest/jsdom CI Fix

## Problem
The CI pipeline was failing with the error:
```
TypeError: Cannot read properties of undefined (reading 'DONT_CONTEXTIFY')
```

This was caused by a compatibility issue between jsdom v26+ and the Node.js environment in GitHub Actions.

## Solution
We've implemented multiple fixes to resolve this issue:

### 1. Updated Vitest Configuration
- **Fixed deprecated `deps.external`** → moved to `server.deps.external`
- **Downgraded jsdom** from `26.1.0` → `25.0.1` for better compatibility
- **Created CI-specific config** (`vitest.config.ci.mts`) that uses `node` environment instead of `jsdom`

### 2. Package.json Changes
```json
{
  "devDependencies": {
    "jsdom": "25.0.1"  // Downgraded for stability
  },
  "scripts": {
    "test:int:ci": "cross-env NODE_OPTIONS=--no-deprecation vitest run --config ./vitest.config.ci.mts"
  }
}
```

### 3. Environment-Specific Configurations

#### Local Development (`vitest.config.mts`)
- Uses `jsdom` environment for full DOM testing
- Includes React testing utilities
- Better for component testing

#### CI Environment (`vitest.config.ci.mts`)
- Uses `node` environment to avoid jsdom issues
- Optimized for headless testing
- Prevents CI-specific DOM compatibility problems

### 4. Enhanced Setup File
Updated `vitest.setup.ts` with:
- Global polyfills for TextEncoder/TextDecoder
- Better environment detection
- Improved CI compatibility

## Usage

### Local Testing
```bash
# Full test suite (uses jsdom)
pnpm test

# Individual test types
pnpm test:unit
pnpm test:int
```

### CI Testing
```bash
# CI-optimized (uses node environment)
pnpm test:int:ci
```

## Files Modified
- `vitest.config.mts` - Updated syntax, fixed deprecations
- `vitest.config.ci.mts` - New CI-specific configuration
- `vitest.setup.ts` - Enhanced environment setup
- `package.json` - Downgraded jsdom, updated CI script

## Why This Works
1. **Environment Separation**: CI uses `node` environment avoiding jsdom compatibility issues
2. **Dependency Management**: Proper external dependency handling
3. **Stability**: jsdom v25 is more stable in CI environments
4. **Flexibility**: Local development still has full DOM testing capabilities

## Future Considerations
- Monitor jsdom updates for compatibility improvements
- Consider migrating to Playwright for component testing if DOM testing is critical in CI
- Update to newer jsdom versions when compatibility issues are resolved