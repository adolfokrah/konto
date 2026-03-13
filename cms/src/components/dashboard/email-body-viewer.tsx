'use client'

import { useEffect, useRef } from 'react'

type Props = {
  html: string | null
  text: string | null
}

// Strip quoted reply text from plain-text bodies
function stripQuotedText(raw: string): string {
  const lines = raw.split('\n')
  const quoteStart = lines.findIndex((line) =>
    /^-{2,}\s*On .+ wrote\s*-{2,}$/i.test(line.trim()) ||
    /^On .+wrote:$/i.test(line.trim()) ||
    /^>{1,}/.test(line.trim())
  )
  if (quoteStart > 0) return lines.slice(0, quoteStart).join('\n').trimEnd()
  return raw
}

export function EmailBodyViewer({ html, text }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      const body = iframe.contentDocument?.body
      if (body) {
        iframe.style.height = body.scrollHeight + 16 + 'px'
      }
    }
    iframe.addEventListener('load', onLoad)
    return () => iframe.removeEventListener('load', onLoad)
  }, [html])

  if (html) {
    const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
  }
  body { padding: 0 2px; }
  a { color: #4f46e5; }
  img { max-width: 100%; height: auto; }
  p { margin: 0 0 12px; }
  p:last-child { margin-bottom: 0; }
  blockquote { display: none; }
  .gmail_quote { display: none; }
  div[class*="quote"] { display: none; }
</style>
</head>
<body>${html}</body>
</html>`

    return (
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-same-origin allow-popups"
        className="w-full min-h-20 border-0 bg-white"
        title="Email content"
        style={{ height: '120px' }}
      />
    )
  }

  if (text) {
    const cleaned = stripQuotedText(text)
    return (
      <p className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
        {cleaned}
      </p>
    )
  }

  return <p className="text-sm text-gray-400 italic">No content.</p>
}
