#!/bin/bash

# Fix autolinking issue for Expo SDK 53
# This script addresses the ExpoModulesPackage import issue

echo "🔧 Fixing autolinking for Expo SDK 53..."

# Navigate to mobile-app directory
cd "$(dirname "$0")"

# Clear React Native cache
echo "📦 Clearing React Native cache..."
npx react-native clean || echo "React Native clean not available, skipping..."

# Clear npm/pnpm cache
echo "🧹 Clearing package manager cache..."
pnpm store prune || echo "pnpm cache clear failed, continuing..."

# Clear autolinking cache
echo "🔗 Clearing autolinking cache..."
rm -rf node_modules/.expo || echo "No .expo cache found"
rm -rf android/app/build/generated/autolinking || echo "No autolinking cache found"

# Reinstall dependencies
echo "📥 Reinstalling dependencies..."
pnpm install

# Run autolinking manually
echo "🔗 Running autolinking..."
npx expo install --fix || echo "Expo install --fix not available"

# Generate autolinking files
echo "📝 Regenerating autolinking files..."
npx @react-native-community/cli autolinking || echo "Manual autolinking not available"

echo "✅ Autolinking fix completed!"
echo "💡 If the issue persists, try running 'expo prebuild --clean' to regenerate native projects"
