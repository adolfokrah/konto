# Flutter Commands for Mobile App

# Development commands
run:
	@echo "🚀 Running Flutter app..."
	@flutter run

run-android:
	@echo "🚀 Running Flutter app on Android..."
	@flutter run -d android

run-ios:
	@echo "🚀 Running Flutter app on iOS..."
	@flutter run -d ios

run-release:
	@echo "🚀 Running Flutter app in release mode..."
	@flutter run --release

# Build commands
build-android:
	@echo "🔧 Building Android APK..."
	@flutter build apk

build-android-release:
	@echo "🔧 Building Android APK (release)..."
	@flutter build apk --release

build-ios:
	@echo "🔧 Building iOS..."
	@flutter build ios

build-ios-release:
	@echo "🔧 Building iOS (release)..."
	@flutter build ios --release

# Test commands
test:
	@echo "🧪 Running Flutter tests..."
	@flutter test

# Flutter maintenance commands
clean:
	@echo "🧹 Cleaning Flutter project and regenerating files..."
	@flutter clean
	@flutter pub get
	@cd ios && pod install && cd .. || true

upgrade:
	flutter pub upgrade

analyze:
	flutter analyze

format:
	dart format .

# Show available commands
help:
	@echo "🚀 Flutter Commands for Mobile App"
	@echo ""
	@echo "📱 Run Commands:"
	@echo "  make run                 - Run app"
	@echo "  make run-android         - Run on Android"
	@echo "  make run-ios             - Run on iOS"
	@echo "  make run-release         - Run in release mode"
	@echo ""
	@echo "🔧 Build Commands:"
	@echo "  make build-android       - Build Android APK (debug)"
	@echo "  make build-android-release - Build Android APK (release)"
	@echo "  make build-ios           - Build iOS (debug)"
	@echo "  make build-ios-release   - Build iOS (release)"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test                - Run tests"
	@echo ""
	@echo "🔍 Utilities:"
	@echo "  make clean               - Clean and get dependencies"
	@echo "  make upgrade             - Upgrade dependencies"
	@echo "  make analyze             - Analyze code"
	@echo "  make format              - Format code"

.PHONY: help run run-android run-ios run-release build-android build-android-release build-ios build-ios-release test clean upgrade analyze format
