import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Allow all API routes and public pages
  const publicRoutes = ['/', '/explore', '/api', '/auth']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route + '/')
  )
  
  if (isPublicRoute || request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // For protected routes, NextAuth will handle authentication
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

