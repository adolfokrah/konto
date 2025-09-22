# Internationalization (i18n) Setup - App Router

This setup provides locale-based routing for your Next.js App Router application with support for English (en) and French (fr).

## How it works

### URL Structure

- `usehoga.com` → serves English content (no redirect)
- `usehoga.com/about` → serves English about page (no redirect)
- `usehoga.com/fr` → French home page
- `usehoga.com/fr/about` → French about page
- `usehoga.com/en` → English home page (optional explicit locale)
- `usehoga.com/en/about` → English about page (optional explicit locale)
- `usehoga.com/es` → redirects to `usehoga.com` (unsupported locale fallback)
- `usehoga.com/es/about` → redirects to `usehoga.com/about` (unsupported locale fallback)

### How It Works Internally

1. **Root paths** (no locale prefix) serve English content directly
2. **Middleware** internally rewrites root paths to `/en/*` for the App Router
3. **Locale-specific paths** like `/fr/*` are served directly
4. **Unsupported locales** like `/es/*` redirect to root English paths (remove locale)
5. **Automatic locale preservation**: When navigating from `/fr/*` pages, middleware detects the referer and automatically redirects new links to `/fr/*` versions
6. **No component changes needed**: All existing Link components work as-is - the middleware handles locale preservation automatically

### Key Features

✅ **Clean URLs**: `usehoga.com/about` instead of `usehoga.com/en/about`  
✅ **No forced redirects**: Users stay on the URL they typed  
✅ **Automatic locale preservation**: Links clicked from `/fr/*` pages automatically go to `/fr/*` versions  
✅ **Unsupported locale fallback**: `/es/*` redirects to English root paths  
✅ **Zero component changes**: All existing Link components work automatically  
✅ **SEO friendly**: Root domain serves content directly  
✅ **Backward compatible**: `/en/*` paths still work if needed

### Language Switching

The language switcher components still work intelligently:

- From root paths: adds locale prefix for non-English
- From locale paths: removes prefix for English, replaces for others

### Usage in App Router Components

```tsx
'use client'
import { useLocale } from '@/hooks/useLocale'
import { useTranslations } from '@/lib/translations'

function MyComponent() {
  const { currentLocale } = useLocale()
  const { t } = useTranslations(currentLocale as SupportedLocale)

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>Current locale: {currentLocale}</p>
    </div>
  )
}
```

### Usage in Server Components

```tsx
// In your page.tsx files, you get the locale from params
export default function MyPage({ params }: { params: { locale: string } }) {
  // You can use the locale directly here for server-side logic
  const isEnglish = params.locale === 'en'

  return (
    <div>
      <h1>{isEnglish ? 'Welcome' : 'Bienvenue'}</h1>
      {/* Use client components for dynamic locale switching */}
      <LocaleExample />
    </div>
  )
}
```

### Adding the Locale Example Component

Add this to any of your existing pages to test the i18n setup:

```tsx
import { LocaleExample } from '@/components/LocaleExample'

// In your page component
;<LocaleExample className="mb-6" />
```

### Language Switcher

Two components are available:

- `LanguageSwitcher` - Dropdown select (needs 'use client')
- `LanguageSwitcherButtons` - Button-based switcher (needs 'use client')

```tsx
'use client'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
;<LanguageSwitcher />
```

### Adding More Locales

1. Update middleware locales array
2. Update `generateStaticParams` in locale layout
3. Add new translation file (e.g., `es.ts` for Spanish)
4. Update the translations index file
5. Update the `SupportedLocale` type

### Important Notes for App Router

- **Client Components**: Use `'use client'` directive for components that use locale hooks
- **Server Components**: Access locale via `params.locale` in page components
- **Layout Structure**: The `[locale]` layout handles HTML structure, main layout focuses on content
- **Middleware**: Automatically redirects root and non-locale paths to default locale
- **Static Generation**: `generateStaticParams` pre-generates pages for both locales

### Testing

1. Start your dev server: `pnpm dev`
2. Visit `http://localhost:3000` - should show English content (no redirect)
3. Visit `http://localhost:3000/about` - should show English about page
4. Visit `http://localhost:3000/fr` - should show French home page
5. Visit `http://localhost:3000/fr/about` - should show French about page
6. Visit `http://localhost:3000/es` - should redirect to `http://localhost:3000` (unsupported locale)
7. Visit `http://localhost:3000/es/about` - should redirect to `http://localhost:3000/about` (unsupported locale)
8. Use the language switcher to test switching between locales
9. Test that switching from root English paths to French adds `/fr/` prefix
10. Test that switching from French paths to English removes `/fr/` prefix

### Migration Notes

- Moved all frontend pages into `[locale]` folder
- Updated layout structure to work with App Router patterns
- Hooks now use App Router navigation (`useParams`, `usePathname`, `useRouter` from 'next/navigation')
- Components requiring interactivity need `'use client'` directive
