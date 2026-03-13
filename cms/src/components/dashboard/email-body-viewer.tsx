'use client'

import { useEffect, useRef } from 'react'

type Props = {
  html: string | null
  text: string | null
}

export function EmailBodyViewer({ html, text }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!html || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()

    // Auto-size iframe to content height
    const resize = () => {
      if (iframeRef.current && doc.body) {
        iframeRef.current.style.height = doc.body.scrollHeight + 'px'
      }
    }
    resize()
    iframeRef.current.addEventListener('load', resize)
  }, [html])

  if (html) {
    return (
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        className="w-full min-h-[200px] border-0"
        title="Email content"
      />
    )
  }

  if (text) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
        {text}
      </pre>
    )
  }

  return <p className="text-sm text-muted-foreground italic">No content available.</p>
}
