'use client'

import React, { createContext, useCallback, use, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import canUseDOM from '@/utilities/canUseDOM'
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { themeIsValid } from './types'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    // Always enforce light theme
    const lightTheme = 'light'
    setThemeState(lightTheme)
    window.localStorage.setItem(themeLocalStorageKey, lightTheme)
    document.documentElement.setAttribute('data-theme', lightTheme)
  }, [])

  useEffect(() => {
    // Always use light theme
    const themeToSet: Theme = 'light'
    
    document.documentElement.setAttribute('data-theme', themeToSet)
    setThemeState(themeToSet)
    window.localStorage.setItem(themeLocalStorageKey, themeToSet)
  }, [])

  return <ThemeContext value={{ setTheme, theme }}>{children}</ThemeContext>
}

export const useTheme = (): ThemeContextType => use(ThemeContext)
