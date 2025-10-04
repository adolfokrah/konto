# App Store Button Components

This directory contains reusable App Store and Google Play button components.

## Components

### Button Components (Full buttons with text)

- `AppStoreButton` - Individual Apple App Store button
- `GooglePlayButton` - Individual Google Play button
- `AppStoreButtons` - Combined component that renders both buttons

### Icon Components (Small circular icons)

- `AppStoreIcon` - Small Apple App Store icon
- `GooglePlayIcon` - Small Google Play icon
- `AppStoreIcons` - Combined component that renders both icons

## Usage Examples

### Full Buttons

```tsx
import { AppStoreButtons } from '@/components/ui'

;<AppStoreButtons
  appStoreButton={{
    show: true,
    url: 'https://apps.apple.com/app/...',
  }}
  googlePlayButton={{
    show: true,
    url: 'https://play.google.com/store/apps/details?id=...',
  }}
  variant="default" // or "light"
  orientation="horizontal" // or "vertical"
/>
```

### Small Icons

```tsx
import { AppStoreIcons } from '@/components/ui'

;<AppStoreIcons
  appleAppStoreUrl="https://apps.apple.com/app/..."
  googlePlayStoreUrl="https://play.google.com/store/apps/details?id=..."
  variant="default" // or "light"
/>
```

## Variants

- `default` - White background with black text/icons
- `light` - Semi-transparent white background with white text/icons (for dark backgrounds)

## Usage in Project

- **CallToAction Block**: Uses `AppStoreButtons` for full-sized buttons
- **HighImpact Hero**: Uses `AppStoreIcons` for small circular icons
- **MediumImpact Hero**: Uses `AppStoreButtons` with `light` variant
