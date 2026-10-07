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
  // Closed by default so the reading pane keeps its width (v4 three-pane inbox).
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-card">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 px-5 pb-2 pt-4">
          <h1 className="flex-1 truncate font-chillax text-[20px] font-semibold text-[#1B232E]">
            {subject}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {isActive && (
              <span className="flex h-[22px] items-center gap-1.5 rounded-[7px] bg-[#EAF2FF] px-2 text-[11.5px] font-semibold text-[#2E7CF6]">
                Inbox
              </span>
            )}
            {messageCount > 1 && (
              <span className="rounded-md bg-secondary px-1.5 py-px text-[10.5px] font-medium tabular-nums text-muted-foreground">
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
        <div className="flex-1 overflow-y-auto">{body}</div>

        {/* Reply box */}
        {replyBox && (
          <div className="shrink-0 p-4 pt-2">
            <div className="overflow-hidden rounded-[14px] shadow-[inset_0_0_0_1px_hsl(var(--border))]">
              {replyBox}
            </div>
          </div>
        )}
      </div>

      {sidebarOpen && <EmailContactSidebar {...sidebarProps} />}
    </>
  )
}
