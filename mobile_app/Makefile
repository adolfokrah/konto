# Flutter + Infisical Commands for Mobile App
# Using konto-mobile-app Infisical project (dev environment only)

# Development commands
run:
	@echo "🚀 Running Flutter app with Infisical secrets..."
	@infisical secrets --env=dev --plain | \
	awk -F '=' '{print "--dart-define=" $$1 "=" $$2}' | \
	xargs infisical run --env=dev -- flutter run

run-android:
	@echo "🚀 Running Flutter app on Android with Infisical secrets..."
	@infisical secrets --env=dev --plain | \
	awk -F '=' '{print "--dart-define=" $$1 "=" $$2}' | \
	xargs infisical run --env=dev -- flutter run -d android

run-ios:
	@echo "🚀 Running Flutter app on iOS with Infisical secrets..."
	@infisical secrets --env=dev --plain | \
	awk -F '=' '{print "--dart-define=" $$1 "=" $$2}' | \
	xargs infisical run --env=dev -- flutter run -d ios

run-release:
	@echo "🚀 Running Flutter app in release mode with Infisical secrets..."
	@infisical secrets --env=dev --plain | \
	awk -F '=' '{print "--dart-define=" $$1 "=" $$2}' | \
	xargs infisical run --env=dev -- flutter run --release

# Build commands
build-android:
	infisical run --env=dev -- flutter build apk

build-android-release:
	infisical run --env=dev -- flutter build apk --release

build-ios:
	infisical run --env=dev -- flutter build ios

build-ios-release:
	infisical run --env=dev -- flutter build ios --release

# Generate .env file for IDE (optional, for flutter_dotenv compatibility)
env:
	infisical run --env=dev --command="env | grep -E '^(API_BASE_URL|IMAGE_BASE_URL|MNOTIFY_API_KEY|PAYLOAD_SECRET)=' > .env && echo '✅ Environment file generated for IDE'"

# Test commands
test:
	@echo "🧪 Running Flutter tests with Infisical secrets..."
	@infisical secrets --env=dev --plain | \
	awk -F '=' '{print "--dart-define=" $$1 "=" $$2}' | \
	xargs infisical run --env=dev -- flutter test

# Fallback commands without secrets
run-no-secrets:
	flutter run

run-android-no-secrets:
	flutter run -d android

run-ios-no-secrets:
	flutter run -d ios

# Flutter maintenance commands
clean:
	flutter clean && flutter pub get

upgrade:
	flutter pub upgrade

analyze:
	flutter analyze

format:
	dart format .

# Infisical utilities
secrets:
	infisical secrets --env=dev

# Show available commands
help:
	@echo "🚀 Flutter + Infisical Commands for Mobile App (Dev Environment)"
	@echo ""
	@echo "📱 Run Commands:"
	@echo "  make run                 - Run with development environment"
	@echo "  make run-android         - Run on Android with dev environment"
	@echo "  make run-ios             - Run on iOS with dev environment"
	@echo "  make run-release         - Run in release mode with dev environment"
	@echo ""
	@echo "🔧 Build Commands:"
	@echo "  make build-android       - Build Android APK (debug)"
	@echo "  make build-android-release - Build Android APK (release)"
	@echo "  make build-ios           - Build iOS (debug)"
	@echo "  make build-ios-release   - Build iOS (release)"
	@echo ""
	@echo "📝 Environment:"
	@echo "  make env                 - Generate .env file for IDE"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test                - Run tests with development environment"
	@echo ""
	@echo "🔍 Utilities:"
	@echo "  make secrets             - List development secrets"
	@echo "  make clean               - Clean and get dependencies"
	@echo "  make upgrade             - Upgrade dependencies"
	@echo "  make analyze             - Analyze code"
	@echo "  make format              - Format code"
	@echo ""
	@echo "💡 Fallback (no secrets):"
	@echo "  make run-no-secrets      - Run without Infisical"
	@echo "  make run-android-no-secrets - Run Android without Infisical"
	@echo "  make run-ios-no-secrets  - Run iOS without Infisical"

.PHONY: help run run-android run-ios run-release build-android build-android-release build-ios build-ios-release env test run-no-secrets run-android-no-secrets run-ios-no-secrets clean upgrade analyze format secrets
