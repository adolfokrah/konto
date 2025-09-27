declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      VERCEL_URL: string
    }
  }
}

// CSS Module declarations
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.module.css' {
  const content: { [className: string]: string }
  export default content
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
