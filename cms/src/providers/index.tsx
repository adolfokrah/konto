import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { Toaster } from '@/components/ui/sonner'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        {children}
        <Toaster />
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
