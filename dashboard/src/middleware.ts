import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // If on a public auth page and token exists, redirect to /builds
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL('/builds', request.url))
  }

  // Protected routes: /builds, /admin, and root dashboard
  const isProtected =
    pathname.startsWith('/builds') ||
    pathname.startsWith('/admin') ||
    pathname === '/'

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
