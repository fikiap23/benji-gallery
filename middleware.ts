import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  const protectedPaths = ['/', '/gallery', '/upload', '/messages']
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isProtected) {
    // Kalau tidak ada token → redirect ke login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
      // Verify token
      jwt.verify(token, JWT_SECRET)

      return NextResponse.next()
    } catch (err) {
      const response = NextResponse.redirect(new URL('/login', req.url))
      response.cookies.set('token', '', { maxAge: 0 }) // hapus token
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/gallery/:path*', '/upload/:path*', '/messages/:path*'],
}
