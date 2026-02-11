# Hoga Mobile App

A Flutter mobile application.

## Running

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

## Environment

Copy `.env.example` to `.env` and fill in your values. The app loads environment variables from `.env` via `flutter_dotenv`.
