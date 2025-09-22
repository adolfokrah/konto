'use client'

import { useLocale } from '@/hooks/useLocale'
import { useTranslations } from '@/lib/translations'
import { LanguageSwitcher, LanguageSwitcherButtons } from '@/components/LanguageSwitcher'
import type { SupportedLocale } from '@/hooks/useLocale'

interface LocaleExampleProps {
  className?: string
}

/**
 * Example component showing how to use internationalization
 * You can use this component in your existing pages
 */
export function LocaleExample({ className = '' }: LocaleExampleProps) {
  const { currentLocale, getPathWithoutLocale } = useLocale()
  const { t } = useTranslations(currentLocale as SupportedLocale)

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-blue-900">🌍 {t('welcome')}</h3>
        <LanguageSwitcher />
      </div>

      <p className="text-blue-800 mb-4">{t('description')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-white p-3 rounded">
          <h4 className="font-medium mb-2">Locale Info:</h4>
          <ul className="space-y-1">
            <li>
              Current: <code className="bg-gray-100 px-1 rounded">{currentLocale}</code>
            </li>
            <li>
              Path: <code className="bg-gray-100 px-1 rounded">{getPathWithoutLocale()}</code>
            </li>
          </ul>
        </div>

        <div className="bg-white p-3 rounded">
          <h4 className="font-medium mb-2">Sample Translations:</h4>
          <ul className="space-y-1">
            <li>
              {t('home')} | {t('about')} | {t('contact')}
            </li>
            <li>
              {t('login')} | {t('signup')}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <h4 className="font-medium mb-2">Language Switcher Buttons:</h4>
        <LanguageSwitcherButtons />
      </div>
    </div>
  )
}
