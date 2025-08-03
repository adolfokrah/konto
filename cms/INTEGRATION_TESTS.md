# Integration Tests

This document describes how to run the integration tests for the Konto CMS application.

## Overview

The integration tests cover all major collections:

- **Users** (22 tests) - User management, authentication, and settings
- **Jars** (23 tests) - Savings jar creation, management, and relationships
- **Contributions** (24 tests) - Payment tracking and contribution management
- **API** (1 test) - Basic API health check

**Total: 70 comprehensive integration tests**

## Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB running locally or accessible remotely

## Running Tests Locally

### 1. Setup Environment

Create a `test.env` file in the `cms` directory (already configured):

```bash
NODE_ENV=test
DATABASE_URI_TEST=mongodb://localhost:27017/payload-test
PAYLOAD_SECRET=test-secret-key-for-local-development
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### 2. Start MongoDB

Using Docker:

```bash
docker run --name mongo-test -p 27017:27017 -d mongo:7.0
```

Or use your local MongoDB installation.

### 3. Install Dependencies

```bash
cd cms
pnpm install
```

### 4. Run Integration Tests

Run all integration tests:

```bash
pnpm run test:int
```

Run specific test files:

```bash
pnpm run test:int tests/int/users.int.spec.ts
pnpm run test:int tests/int/jars.int.spec.ts
pnpm run test:int tests/int/contributions.int.spec.ts
```

Run with watch mode (for development):

```bash
npx vitest --config ./vitest.config.mts tests/int/
```

## GitHub Actions

The integration tests run automatically on:

- **Push to main/develop branches** - When CMS files change
- **Pull requests to main** - For code review validation
- **Manual trigger** - Via GitHub Actions UI

### Workflow Features

- ✅ MongoDB 7.0 service container
- ✅ Node.js 18 with pnpm caching
- ✅ Environment isolation
- ✅ Automatic dependency installation
- ✅ Test artifact upload on failures
- ✅ Path-based triggering (only runs when CMS code changes)

### Viewing Results

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Select "Integration Tests" workflow
4. View test results and logs

## Test Structure

```
tests/int/
├── api.int.spec.ts           # API health checks
├── users.int.spec.ts         # User management tests
├── jars.int.spec.ts          # Jar creation and management
└── contributions.int.spec.ts # Payment and contribution tests
```

## Troubleshooting

### MongoDB Connection Issues

If tests fail with database connection errors:

1. Ensure MongoDB is running on port 27017
2. Check the `DATABASE_URI_TEST` environment variable
3. Verify MongoDB accepts connections

### TypeScript Errors

If you encounter TypeScript errors:

```bash
pnpm run type-check
```

### Test Isolation Issues

Tests use unique email addresses and proper cleanup. If you see conflicts:

1. Clear the test database manually
2. Restart MongoDB
3. Re-run tests

### Memory Issues

For large test suites, increase Node.js memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm run test:int
```

## Contributing

When adding new tests:

1. Follow the existing test patterns
2. Use unique identifiers (timestamps, random strings)
3. Clean up test data in `beforeEach` hooks
4. Test both success and error scenarios
5. Validate relationships between collections

## Performance

- **Local execution**: ~10-15 seconds
- **GitHub Actions**: ~2-3 minutes (including setup)
- **Test isolation**: Each test creates fresh data
- **Database cleanup**: Automatic between tests
