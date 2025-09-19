'use client'

import { useLocale } from '@/hooks/useLocale'

interface LanguageSwitcherProps {
  className?: string
}

const languageNames = {
  en: 'English',
  fr: 'Français',
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { currentLocale, locales, switchLocale } = useLocale()

  return (
    <div className={`language-switcher ${className}`}>
      <select 
        value={currentLocale} 
        onChange={(e) => switchLocale(e.target.value)}
        className="border rounded px-2 py-1"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {languageNames[locale as keyof typeof languageNames] || locale.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  )
}

// Alternative button-based language switcher
export function LanguageSwitcherButtons({ className = '' }: LanguageSwitcherProps) {
  const { currentLocale, locales, switchLocale } = useLocale()

  return (
    <div className={`flex space-x-2 ${className}`}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-3 py-1 rounded ${
            currentLocale === locale 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {languageNames[locale as keyof typeof languageNames] || locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}