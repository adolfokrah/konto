'use client'

import { useState, useTransition } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Bug, PlugZap, Server, Zap } from 'lucide-react'
import { toast } from 'sonner'

import {
  captureServerError,
  checkDestinations,
  throwServerError,
  type DestinationCheck,
} from '@/app/sentry-test/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  clientDsnSet: boolean
  serverDsnSet: boolean
}

export function SentryTestButtons({ clientDsnSet, serverDsnSet }: Props) {
  const [crash, setCrash] = useState(false)
  const [checks, setChecks] = useState<DestinationCheck[] | null>(null)
  const [pending, startTransition] = useTransition()

  // Throwing during render surfaces the error to the nearest error boundary,
  // which is what Sentry's React instrumentation hooks into.
  if (crash) {
    throw new Error('Sentry test: uncaught client render error')
  }

  const handleCaptureClient = () => {
    const eventId = Sentry.captureException(new Error('Sentry test: captured browser error'))
    toast.success(`Sent to both destinations — event ${eventId.slice(0, 8)}`)
  }

  const handleCheckDestinations = () => {
    startTransition(async () => {
      try {
        const results = await checkDestinations()
        setChecks(results)

        if (!results.length) {
          toast.error('No destinations configured')
        } else if (results.every((result) => result.ok)) {
          toast.success(`${results.length} destination(s) accepted the event`)
        } else {
          toast.error('At least one destination rejected the event')
        }
      } catch {
        toast.error('Destination check failed')
      }
    })
  }

  const handleCaptureServer = () => {
    startTransition(async () => {
      try {
        const eventId = await captureServerError()
        toast.success(
          eventId ? `Sent from server — event ${eventId.slice(0, 8)}` : 'Sent from server',
        )
      } catch {
        toast.error('Server action failed')
      }
    })
  }

  const handleThrowServer = () => {
    startTransition(async () => {
      try {
        await throwServerError()
      } catch {
        // The throw is the point — Sentry records it server-side before it gets here.
        toast.success('Server threw — check both destinations for the event')
      }
    })
  }

  return (
    <div className="space-y-4">
      {!clientDsnSet && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No <code className="font-mono text-xs">NEXT_PUBLIC_SENTRY_DSN</code> set — the buttons
          still throw, but nothing is delivered.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-destination check</CardTitle>
          <CardDescription>
            Posts one event to each ingest endpoint separately and reports what each answered. The
            error buttons below only surface Sentry&apos;s result, so this is how a Better Stack
            problem becomes visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleCheckDestinations} disabled={pending}>
            <PlugZap className="mr-2 h-4 w-4" />
            Check every destination
          </Button>

          {checks?.length ? (
            <div className="space-y-2 text-sm">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between gap-3 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{check.label}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{check.host}</p>
                    {check.detail ? (
                      <p className="text-xs text-destructive">{check.detail}</p>
                    ) : null}
                  </div>
                  <span
                    className={
                      check.ok
                        ? 'shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400'
                        : 'shrink-0 text-xs font-medium text-destructive'
                    }
                  >
                    {check.ok ? 'Accepted' : 'Failed'}
                    {check.statusCode ? ` (${check.statusCode})` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {checks?.length === 0 ? (
            <p className="text-sm text-destructive">No destinations configured.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handled errors</CardTitle>
          <CardDescription>
            Reported with <code className="font-mono text-xs">captureException</code>. The page
            keeps working.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleCaptureClient}>
            <Zap className="mr-2 h-4 w-4" />
            Capture browser error
          </Button>
          <Button
            variant="outline"
            onClick={handleCaptureServer}
            disabled={pending || !serverDsnSet}
          >
            <Server className="mr-2 h-4 w-4" />
            Capture server error
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uncaught errors</CardTitle>
          <CardDescription>
            Real crashes. The browser one replaces this page with the error screen — reload to come
            back.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="destructive" onClick={() => setCrash(true)}>
            <Bug className="mr-2 h-4 w-4" />
            Throw browser error
          </Button>
          <Button variant="destructive" onClick={handleThrowServer} disabled={pending}>
            <Bug className="mr-2 h-4 w-4" />
            Throw server error
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
