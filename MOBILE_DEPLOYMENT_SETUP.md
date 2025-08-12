# Mobile Deployment Setup

This setup allows GitHub Actions to trigger Codemagic builds based on commit message patterns, instead of Codemagic automatically building on every push to main.

## 🔧 Setup Instructions

### 1. Codemagic Configuration

In your Codemagic app settings:

1. **Disable automatic triggers**: 
   - Go to your app → Workflows → Your workflow
   - Under "Triggering" section, **disable** "Trigger on push" for main/master branch
   - This prevents automatic builds on merge to main

2. **Enable API access**:
   - Go to Teams → Your team → Integrations → Codemagic API
   - Generate an API token and copy it

3. **Get your App ID and Workflow ID**:
   - App ID: Found in your app URL: `https://codemagic.io/apps/{APP_ID}`
   - Workflow ID: Found in workflow settings or URL

### 2. GitHub Secrets Configuration

Add these secrets to your GitHub repository:
- Go to Settings → Secrets and variables → Actions → New repository secret

**Required secrets:**
```
CODEMAGIC_API_TOKEN=your_api_token_here
CODEMAGIC_APP_ID=your_app_id_here  
CODEMAGIC_WORKFLOW_ID=your_workflow_id_here
```

**Environment variables (passed to Codemagic):**
```
API_BASE_URL=https://your-production-api.com/api
MNOTIFY_API_KEY=your_production_mnotify_key
MNOTIFY_SENDER_ID=your_sender_id
MNOTIFY_API_BASE_URL=https://api.mnotify.com/api/sms/quick
```

### 3. Codemagic Environment Variables

In your Codemagic workflow, these variables will be available:
- `VERSION_BUMP` (major/minor/patch)
- `GITHUB_SHA` 
- `GITHUB_REF`
- `API_BASE_URL`
- `MNOTIFY_API_KEY`
- `MNOTIFY_SENDER_ID` 
- `MNOTIFY_API_BASE_URL`

## 🚀 How It Works

### Commit Message Patterns

The GitHub Action triggers Codemagic builds based on commit messages:

- **`major:`** or **`MAJOR:`** → Major version bump (1.0.0 → 2.0.0)
- **`feat:`** or **`FEAT:`** → Minor version bump (1.0.0 → 1.1.0)  
- **`fix:`** or **`FIX:`** → Patch version bump (1.0.0 → 1.0.1)

### Example Commit Messages

✅ **These WILL trigger builds:**
```
feat: add user profile settings
fix: resolve login timeout issue
major: breaking API changes for v2
```

❌ **These will NOT trigger builds:**
```
docs: update README
chore: update dependencies
refactor: improve code structure
```

### Workflow

1. **Developer pushes** to main with proper commit message
2. **GitHub Action runs** and detects the pattern
3. **GitHub Action calls** Codemagic API to trigger build
4. **Codemagic builds** with environment variables from GitHub
5. **App gets deployed** with proper version bump

## 🎯 Benefits

- **Control**: Only builds when you want (via commit messages)
- **Environment Management**: Environment variables managed in GitHub
- **Version Control**: Automatic semantic versioning based on commit type
- **Flexibility**: Easy to modify trigger conditions
- **Security**: Sensitive data stored in GitHub Secrets, not Codemagic

## 🔍 Monitoring

- Check GitHub Actions tab for trigger status
- Check Codemagic dashboard for build progress
- Build logs show which environment variables were passed
