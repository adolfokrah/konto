// Type augmentation for Payload CMS route handlers
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ [key: string]: string | string[] }>
}

declare module '@payloadcms/next/routes' {
  export function REST_OPTIONS(
    config?: any,
  ): (req: NextRequest, context: RouteContext) => Promise<NextResponse>

  export function REST_GET(
    config?: any,
  ): (req: NextRequest, context: RouteContext) => Promise<NextResponse>

  export function REST_POST(
    config?: any,
  ): (req: NextRequest, context: RouteContext) => Promise<NextResponse>

  export function REST_PUT(
    config?: any,
  ): (req: NextRequest, context: RouteContext) => Promise<NextResponse>

  export function REST_PATCH(
    config?: any,
  ): (req: NextRequest, context: RouteContext) => Promise<NextResponse>

  export function REST_DELETE(
    config?: any,
  ): (req: NextRequest, context: RouteContext) => Promise<NextResponse>
}
