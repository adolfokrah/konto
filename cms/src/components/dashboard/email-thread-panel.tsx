'use client'

import { useState } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmailContactSidebar, type ContactSidebarProps } from './email-contact-sidebar'

type Props = {
  subject: string
  isActive: boolean
  messageCount: number
  direction: string
  body: React.ReactNode
  replyBox: React.ReactNode | null
  sidebarProps: ContactSidebarProps
}

export function EmailThreadPanel({
  subject,
  isActive,
  messageCount,
  direction,
  body,
  replyBox,
  sidebarProps,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3.5 shrink-0">
          <h1 className="flex-1 truncate text-sm font-semibold text-gray-900">{subject}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            )}
            {messageCount > 1 && (
              <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-px text-[10px] font-medium text-gray-400 tabular-nums">
                {messageCount}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? 'Hide details' : 'Show details'}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Thread body */}
        <div className="flex-1 overflow-y-auto bg-white">{body}</div>

        {/* Reply box */}
        {replyBox && (
          <div className="shrink-0 border-t border-gray-200 bg-white">{replyBox}</div>
        )}
      </div>

      {sidebarOpen && <EmailContactSidebar {...sidebarProps} />}
    </>
  )
}
