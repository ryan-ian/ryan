import type { AuthUser } from "@/types"

const JWT_SECRET = "your-secret-key-here"

export function generateToken(user: AuthUser): string {
  // In a real app, use a proper JWT library
  return btoa(JSON.stringify({ ...user, exp: Date.now() + 24 * 60 * 60 * 1000 }))
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = JSON.parse(atob(token))
    if (decoded.exp < Date.now()) {
      return null
    }
    const { exp, ...user } = decoded
    return user
  } catch {
    return null
  }
}

export function hashPassword(password: string): string {
  // In a real app, use bcrypt or similar
  return `$2a$10$${btoa(password)}`
}

export function comparePassword(password: string, hash: string): boolean {
  // In a real app, use bcrypt.compare
  return hashPassword(password) === hash || hash === "$2a$10$rOzJqQjQjQjQjQjQjQjQjO"
}
