# Mobile App Deployment Guide

This guide explains how the mobile app deployment workflow works with Shorebird for the Konto project.

## Deployment Workflow

The deployment is automated through GitHub Actions and triggers based on commit message patterns when pushing to the `main` branch.

### Commit Message Patterns

The workflow detects the following commit message patterns:

- **`feat:`** - Feature addition (minor version bump)
- **`fix:`** - Bug fix (patch version bump)  
- **`major:`** - Breaking change (major version bump)

### Version Bumping Strategy

The workflow automatically updates the version in `pubspec.yaml` based on the commit type:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `major:` | Major (x.0.0) | 1.2.3 → 2.0.0 |
| `feat:` | Minor (x.y.0) | 1.2.3 → 1.3.0 |
| `fix:` | Patch (x.y.z) | 1.2.3 → 1.2.4 |

### Shorebird Deployment Strategy

Based on the commit type, the workflow deploys differently:

- **`fix:`** commits → **Shorebird Patch** (hot update to existing release)
- **`feat:`** and **`major:`** commits → **Shorebird Release** (new app release)

## Setup Requirements

### GitHub Secrets

Add the following secret to your GitHub repository:

1. **`SHOREBIRD_TOKEN`** - Your Shorebird authentication token
   - Get this from your Shorebird dashboard
   - Go to Repository Settings → Secrets and variables → Actions → New repository secret

### Shorebird Configuration

The app is already configured with Shorebird:
- `mobile_app/shorebird.yaml` contains the app configuration
- App ID: `53bedfda-d473-401b-a14a-0f1cb2dd800b`

## Usage Examples

### Creating a Patch (Hot Update)

For bug fixes that can be deployed as hot updates:

```bash
git commit -m "fix: resolve login validation issue"
git push origin main
```

This will:
1. Bump version from `0.1.2` to `0.1.3`
2. Create a Shorebird patch
3. Deploy the hot update to existing app installations

### Creating a New Release

For new features or major changes:

```bash
git commit -m "feat: add dark mode support"
git push origin main
```

This will:
1. Bump version from `0.1.2` to `0.2.0`
2. Create a new Shorebird release
3. Create a GitHub release with tag `mobile-v0.2.0`

### Major Version Release

For breaking changes:

```bash
git commit -m "major: redesign user interface with new navigation"
git push origin main
```

This will:
1. Bump version from `0.1.2` to `1.0.0`
2. Create a new Shorebird release
3. Create a GitHub release with tag `mobile-v1.0.0`

## Workflow Steps

1. **Trigger**: Push to main branch with changes in `mobile_app/`
2. **Analysis**: Parse commit message to determine update type
3. **Version Update**: Automatically bump version in `pubspec.yaml`
4. **Build**: Run tests and build Android APK
5. **Deploy**: Create Shorebird patch or release based on commit type
6. **Release**: Create GitHub release for major/minor updates

## Manual Deployment

You can also trigger the deployment manually:

1. Go to GitHub Actions tab
2. Select "Mobile App Deploy" workflow
3. Click "Run workflow"
4. Select the branch and run

## Monitoring

- Check GitHub Actions for deployment status
- View deployment summary in the workflow run
- Monitor Shorebird dashboard for patch/release status
- Check GitHub Releases for version history

## Troubleshooting

### Common Issues

1. **Missing Shorebird Token**: Ensure `SHOREBIRD_TOKEN` secret is set
2. **Version Conflicts**: The workflow force updates, but check for any conflicts
3. **Build Failures**: Check Flutter dependencies and test results in the workflow logs

### Manual Recovery

If automatic deployment fails, you can manually run Shorebird commands:

```bash
# Install Shorebird CLI
curl --proto '=https' --tlsv1.2 https://raw.githubusercontent.com/shorebirdtech/install/main/install.sh -sSf | bash

# Login
shorebird login --token YOUR_TOKEN

# Create release (for new features)
cd mobile_app
shorebird release android

# Create patch (for fixes)
cd mobile_app
shorebird patch android
```

## Notes

- Only commits to `main` branch trigger deployment
- Commits without the specified patterns (`feat:`, `fix:`, `major:`) are ignored
- The workflow automatically commits version updates back to the repository
- Android deployment is currently implemented; iOS can be added similarly
