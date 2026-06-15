import jwt from 'jsonwebtoken'
import type { IncomingMessage } from 'http'
import { Role } from '@prisma/client'
import { logger } from './logger'

// The shared secret is used by NextAuth to sign a "backend token" and by this
// server to verify it. Keep it identical in both apps' env files.
const AUTH_SHARED_SECRET = process.env.AUTH_SHARED_SECRET || ''
// A static secret only the Next.js server knows, used for the internal
// syncUser call (service-to-service), which has no end-user JWT yet.
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || ''

export interface AuthContext {
  userId: string | null
  email: string | null
  role: Role | null
  // True when the request is the trusted Next.js server (service-to-service).
  isService: boolean
}

export const anonymousContext: AuthContext = {
  userId: null,
  email: null,
  role: null,
  isService: false,
}

interface BackendTokenPayload {
  sub?: string
  email?: string
  role?: Role
}

function getHeader(headers: IncomingMessage['headers'], name: string): string | undefined {
  const value = headers[name]
  return Array.isArray(value) ? value[0] : value
}

// Builds the auth context from request headers. Works for both HTTP requests
// (Bearer token / service token) and WebSocket connection params.
export function buildAuthContext(headers: Record<string, unknown>): AuthContext {
  const normalized = headers as IncomingMessage['headers']

  const serviceToken = getHeader(normalized, 'x-service-token')
  if (serviceToken && SERVICE_TOKEN && serviceToken === SERVICE_TOKEN) {
    return { ...anonymousContext, isService: true }
  }

  const authHeader = getHeader(normalized, 'authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (!token) return anonymousContext
  if (!AUTH_SHARED_SECRET) {
    logger.warn('AUTH_SHARED_SECRET not set; cannot verify tokens')
    return anonymousContext
  }

  try {
    const payload = jwt.verify(token, AUTH_SHARED_SECRET) as BackendTokenPayload
    return {
      userId: payload.sub ?? null,
      email: payload.email ?? null,
      role: payload.role ?? null,
      isService: false,
    }
  } catch (err) {
    logger.debug('Invalid auth token', { error: (err as Error).message })
    return anonymousContext
  }
}

// --- Authorization guards used inside resolvers ---

export class AuthError extends Error {
  extensions: { code: string }
  constructor(message: string, code = 'FORBIDDEN') {
    super(message)
    this.name = 'AuthError'
    this.extensions = { code }
  }
}

export function requireRole(ctx: AuthContext, roles: Role[]): void {
  if (ctx.isService) return // trusted server bypass
  if (!ctx.role || !roles.includes(ctx.role)) {
    throw new AuthError(`Requires role: ${roles.join(' or ')}`, 'FORBIDDEN')
  }
}

export function requireStaff(ctx: AuthContext): void {
  requireRole(ctx, [Role.STAFF, Role.ADMIN])
}

export function requireAdmin(ctx: AuthContext): void {
  requireRole(ctx, [Role.ADMIN])
}
