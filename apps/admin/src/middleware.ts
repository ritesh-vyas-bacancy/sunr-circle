import { auth } from '@/lib/auth/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(function middleware(req) {
  const { nextUrl } = req
  const session = (req as NextRequest & { auth: unknown }).auth
  const isLoggedIn = !!session

  const isAuthRoute =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/forgot-password')
  const isApiRoute = nextUrl.pathname.startsWith('/api/')
  const isPublicAsset =
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname === '/favicon.ico' ||
    nextUrl.pathname.endsWith('.pdf') ||
    nextUrl.pathname.endsWith('.png') ||
    nextUrl.pathname.endsWith('.jpg') ||
    nextUrl.pathname.endsWith('.svg') ||
    nextUrl.pathname.endsWith('.ico')

  if (isPublicAsset || isApiRoute) return NextResponse.next()

  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
