# Expo Autolinking Fix

This fix addresses the `ExpoModulesPackage` import error that occurs with Expo SDK 53 during Android builds.

## Files Modified/Created:

### 1. `react-native.config.js`
- Configured autolinking for `expo-modules-core`
- Explicitly defined the Android package import path

### 2. `package.json`
- Added `expo-modules-core: ~2.1.6` dependency
- Removed duplicate `expo-dev-client` entry

### 3. `eas.json`
- Added `EXPO_NO_CAPABILITY_SYNC=1` environment variable
- Specified `buildType: "apk"` for Android preview builds

### 4. `fix-autolinking.sh`
- Created a script to manually fix autolinking issues
- Clears caches and regenerates autolinking files

### 5. `.github/workflows/mobile-app-deploy.yml`
- Added autolinking fix step to both preview and production builds
- Clears autolinking cache before builds

## How to Use:

### For Local Development:
```bash
cd mobile-app
./fix-autolinking.sh
```

### For CI/CD:
The GitHub workflow now automatically handles the autolinking fix.

## What This Fixes:

- ❌ `error: cannot find symbol import expo.core.ExpoModulesPackage;`
- ❌ `error: cannot find symbol new ExpoModulesPackage(),`
- ✅ Proper autolinking of Expo modules in Android builds
- ✅ Successful EAS builds for both iOS and Android

## Related Issue:
- [EAS CLI Issue #2789](https://github.com/expo/eas-cli/issues/2789)

## Next Steps:
1. Run `pnpm install` in the mobile-app directory
2. Test the build locally with `eas build --platform android --profile preview --local`
3. If successful, push changes to trigger the GitHub workflow
