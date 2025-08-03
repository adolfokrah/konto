# GitHub Actions Integration Tests Status Badge

Add this badge to your main README.md to show the integration test status:

```markdown
[![Integration Tests](https://github.com/adolfokrah/konto/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/adolfokrah/konto/actions/workflows/integration-tests.yml)
```

## Badge Options

### Basic Status Badge
```markdown
![Integration Tests](https://github.com/adolfokrah/konto/actions/workflows/integration-tests.yml/badge.svg)
```

### Badge with Branch Specification
```markdown
![Integration Tests](https://github.com/adolfokrah/konto/actions/workflows/integration-tests.yml/badge.svg?branch=main)
```

### Clickable Badge (Recommended)
```markdown
[![Integration Tests](https://github.com/adolfokrah/konto/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/adolfokrah/konto/actions/workflows/integration-tests.yml)
```

The badge will automatically update to show:
- ✅ **passing** - All tests successful
- ❌ **failing** - One or more tests failed  
- 🟡 **pending** - Tests currently running
- ⚪ **no status** - No recent runs
