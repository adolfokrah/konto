'use client'

import { createContext, useContext } from 'react'

type DashboardUser = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  role?: string | null
}

const DashboardUserContext = createContext<DashboardUser | null>(null)

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser
  children: React.ReactNode
}) {
  return <DashboardUserContext.Provider value={user}>{children}</DashboardUserContext.Provider>
}

export function useDashboardUser(): DashboardUser {
  const value = useContext(DashboardUserContext)
  return value ?? {}
}

export function useIsAdmin(): boolean {
  return useDashboardUser().role === 'admin'
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null
  return <>{children}</>
}
