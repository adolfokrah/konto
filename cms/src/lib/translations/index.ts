import { en } from './en'
import { fr } from './fr'
import type { SupportedLocale } from '@/hooks/useLocale'

const translations = {
  en,
  fr,
}

export type TranslationKey = keyof typeof en

/**
 * Get translation for a specific key and locale
 */
export function getTranslation(key: TranslationKey, locale: SupportedLocale = 'en'): string {
  const translation = translations[locale]?.[key] || translations.en[key]
  return translation || key
}

/**
 * Hook to get translations for the current locale
 */
export function useTranslations(locale: SupportedLocale = 'en') {
  return {
    t: (key: TranslationKey) => getTranslation(key, locale),
    translations: translations[locale] || translations.en,
  }
}

export { translations }
