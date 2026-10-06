import { SentryTestButtons } from '@/components/sentry-test-buttons'
import { resolveDestinations } from '@/utilities/sentryDualTransport'
import { resolveSentryEnvironment } from '@/utilities/sentryEnvironment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Error Tracking Test',
}

// The DSN checks below have to reflect the running server, not the build machine.
export const dynamic = 'force-dynamic'

export default function SentryTestPage() {
  const server = resolveDestinations(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    process.env.BETTER_STACK_DSN || process.env.NEXT_PUBLIC_BETTER_STACK_DSN,
  )
  const client = resolveDestinations(
    process.env.NEXT_PUBLIC_SENTRY_DSN,
    process.env.NEXT_PUBLIC_BETTER_STACK_DSN,
  )

  const serverDsnSet = Boolean(server.dsn)
  const clientDsnSet = Boolean(client.dsn)
  const environment = resolveSentryEnvironment()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Error Tracking Test</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trigger errors on purpose to confirm they reach Sentry and Better Stack. Safe to use —
          nothing here touches app data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>
            Every event goes to both destinations. Each one is only delivered when its DSN is set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ConfigRow label="Server DSN (SENTRY_DSN)" ok={serverDsnSet} />
          <ConfigRow label="Browser DSN (NEXT_PUBLIC_SENTRY_DSN)" ok={clientDsnSet} />
          <ConfigRow label="Server copy to Better Stack" ok={Boolean(server.secondaryDsn)} />
          <ConfigRow label="Browser copy to Better Stack" ok={Boolean(client.secondaryDsn)} />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono text-xs">{environment}</span>
          </div>
        </CardContent>
      </Card>

      <SentryTestButtons clientDsnSet={clientDsnSet} serverDsnSet={serverDsnSet} />
    </div>
  )
}

function ConfigRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          ok
            ? 'text-xs font-medium text-emerald-600 dark:text-emerald-400'
            : 'text-xs font-medium text-destructive'
        }
      >
        {ok ? 'Configured' : 'Missing'}
      </span>
    </div>
  )
}
