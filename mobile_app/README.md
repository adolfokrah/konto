# konto

A new Flutter project.
# Test trigger for GitHub Actions
# Workflow fix test
# Testing integration trigger

## Running with Infisical Secrets

Standard interactive dev run (secrets + hot reload enabled):

```bash
make run
```

Platform specific:

```bash
make run-android
make run-ios
```

## Hot Reload / Restart Keys

When the run is active and the terminal has focus:

Key | Action
----|-------
`r` | Hot reload
`R` | Hot restart
`q` | Quit

If using VS Code tasks (e.g. `🚀 Run Flutter with Infisical`), click inside that task terminal before pressing the keys.

## Generating Dart Defines File (Optional)

Create a `.dart-defines.env` file from Infisical:

```bash
make generate-defines
```

Then you can add to a launch config:

```jsonc
"args": ["--dart-define-from-file=.dart-defines.env"]
```

Regenerate whenever secrets change, or run the VS Code task `🔄 Generate Dart Defines (Infisical)`.
