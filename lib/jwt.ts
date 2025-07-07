import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET)
}

export async function getCurrentUserId(): Promise<string | null> {
  const token = cookies().get('token')?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return (payload as any).userId || null
  } catch (error) {
    console.error('Failed to verify JWT:', error)
    return null
  }
}
