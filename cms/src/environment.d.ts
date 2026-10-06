declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      VERCEL_URL: string
      VERCEL_ENV: string
      NEXT_PUBLIC_VERCEL_ENV: string
      SENTRY_DSN: string
      NEXT_PUBLIC_SENTRY_DSN: string
      BETTER_STACK_DSN: string
      NEXT_PUBLIC_BETTER_STACK_DSN: string
      SENTRY_ENVIRONMENT: string
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: string
      SENTRY_ORG: string
      SENTRY_PROJECT: string
      SENTRY_AUTH_TOKEN: string
    }
  }
}

// CSS Module declarations
// declare module '*.css' {
//   const content: { [className: string]: string }
//   export default content
// }

// declare module '*.module.css' {
//   const content: { [className: string]: string }
//   export default content
// }

// // If this file has no import/export statements (i.e. is a script)
// // convert it into a module by adding an empty export statement.
// export {}
