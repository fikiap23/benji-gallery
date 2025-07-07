import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Encode secret ke format Uint8Array
function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET)
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  const protectedPaths = ['/', '/gallery', '/upload', '/messages']
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
      // Verifikasi token dengan jose
      const { jwtVerify } = await import('jose')
      await jwtVerify(token, getSecretKey())

      return NextResponse.next()
    } catch (err) {
      console.error('JWT verification failed:', err)
      const res = NextResponse.redirect(new URL('/login', req.url))
      res.cookies.set('token', '', { maxAge: 0 }) // hapus token
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/gallery/:path*', '/upload/:path*', '/messages/:path*'],
}
