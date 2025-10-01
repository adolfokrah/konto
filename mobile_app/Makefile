# Flutter + Infisical Commands for Mobile App
# Using konto-mobile-app Infisical project (dev environment only)

# Development commands
run:
	@echo "🚀 Running Flutter app with Infisical secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter run

run-android:
	@echo "🚀 Running Flutter app on Android with Infisical secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter run -d android

run-ios:
	@echo "🚀 Running Flutter app on iOS with Infisical secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter run -d ios

run-release:
	@echo "🚀 Running Flutter app in release mode with Infisical secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter run --release

# Build commands
build-android:
	@echo "🔧 Building Android APK with secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter build apk

build-android-release:
	@echo "🔧 Building Android APK (release) with secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter build apk --release

build-ios:
	@echo "🔧 Building iOS with secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter build ios

build-ios-release:
	@echo "🔧 Building iOS (release) with secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter build ios --release

# Download secrets from Infisical to .env file
download-secrets:
	@echo "🔑 Downloading secrets from Infisical to .env file..."
	@if ! command -v infisical >/dev/null 2>&1; then \
		echo "❌ Infisical CLI not found. Please install it first."; \
		exit 1; \
	fi
	@infisical export --env=staging --format=dotenv > .env
	@echo "✅ Secrets downloaded to .env file"
	@echo "📄 Contents preview:"
	@head -n 3 .env || true


# Generate .env file for IDE (same as download-secrets for consistency)
env: download-secrets

# Test commands
test:
	@echo "🧪 Running Flutter tests with Infisical secrets from .env file..."
	@$(MAKE) download-secrets
	@flutter test

# NOTE:
# Previous implementation piped secrets through xargs into flutter run.
# That broke hot-reload because flutter's stdin was not attached to an interactive TTY.
# We now build the --dart-define list in a shell variable and invoke flutter directly
# so the terminal remains interactive (r / R for hot reload & restart).

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

# Generate .dart-defines.env file (Infisical -> dotenv) for VS Code debug launch
generate-defines:
	@echo "🛠  Generating .dart-defines.env from Infisical (dev env)...";
	infisical export --env=dev --format=dotenv > .dart-defines.env; \
	echo "✅ Wrote .dart-defines.env"; head -n 3 .dart-defines.env || true

# Infisical utilities
secrets:
	infisical export --env=dev

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
	@echo "  make download-secrets    - Download secrets from Infisical to .env file"
	@echo "  make env                 - Generate .env file for IDE (same as download-secrets)"
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

.PHONY: help run run-android run-ios run-release build-android build-android-release build-ios build-ios-release download-secrets env test run-no-secrets run-android-no-secrets run-ios-no-secrets clean upgrade analyze format secrets
