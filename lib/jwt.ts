const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET)
}
