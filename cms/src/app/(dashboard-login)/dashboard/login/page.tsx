import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { LoginForm } from './login-form'

type SearchParams = Promise<{ redirect?: string; error?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  const redirectTo = sanitizeRedirect(params.redirect) ?? '/dashboard'

  if (user && (user.role === 'admin' || user.role === 'auditor')) {
    redirect(redirectTo)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <img src="/logo_icon.png" alt="" className="h-9 w-9 rounded-[10px]" />
            <span className="font-chillax text-xl font-semibold tracking-tight">Hogapay</span>
            <span className="rounded-[5px] bg-[#D9F57A] px-1.5 py-0.5 text-[10px] font-semibold text-[#1B232E]">
              Admin
            </span>
          </div>
          <h1 className="mt-6 font-chillax text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and password to access the dashboard
          </p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  )
}

function sanitizeRedirect(value: string | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
