'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'

type User = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

export function SidebarWrapper({ user }: { user: User }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="hidden lg:block shrink-0 transition-all duration-200"
      style={{ width: collapsed ? '3.5rem' : '13rem' }}
    >
      <div className="sticky top-0 h-screen">
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>
    </div>
  )
}
