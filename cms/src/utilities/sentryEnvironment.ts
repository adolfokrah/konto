/**
 * Single source of truth for the Sentry `environment` tag.
 *
 * Every `Sentry.init` call (browser, node, edge) resolves through this, so an
 * event can never land in an unexpected environment depending on which runtime
 * threw it.
 *
 * `NODE_ENV` is deliberately not used as a fallback: Vercel builds staging with
 * `NODE_ENV=production`, which would file staging errors under `production`.
 */

// Env values arrive quoted in some deploy setups — same reason `next.config.js`
// has `cleanEnvVar`. An unstripped quote would create a junk Sentry environment,
// or a DSN that fails to parse.
export const cleanEnvValue = (value?: string): string | undefined => {
  const stripped = value?.replace(/^["']|["']$/g, '').trim()
  return stripped ? stripped : undefined
}

const clean = cleanEnvValue

// Vercel preview deployments are what we call staging.
const VERCEL_ENV_TO_SENTRY: Record<string, string> = {
  production: 'production',
  preview: 'staging',
  development: 'development',
}

export const DEFAULT_SENTRY_ENVIRONMENT = 'development'

export function resolveSentryEnvironment(): string {
  // An explicit setting always wins. On the browser only the `NEXT_PUBLIC_`
  // variable is inlined, so both are read and the first defined one is used.
  const explicit =
    clean(process.env.SENTRY_ENVIRONMENT) || clean(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT)

  if (explicit) {
    return explicit
  }

  const vercelEnv = clean(process.env.VERCEL_ENV) || clean(process.env.NEXT_PUBLIC_VERCEL_ENV)

  if (vercelEnv) {
    return VERCEL_ENV_TO_SENTRY[vercelEnv] || vercelEnv
  }

  return DEFAULT_SENTRY_ENVIRONMENT
}
