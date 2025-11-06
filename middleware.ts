import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This array contains paths that don't require authentication
const publicPaths = ['/login']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')
  const { pathname } = request.nextUrl

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!token && !publicPaths.includes(pathname)) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
