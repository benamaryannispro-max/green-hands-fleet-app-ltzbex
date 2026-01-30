import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

// Re-export session interface from auth routes
export interface Session {
  userId: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'driver' | 'team_leader' | 'admin';
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Global sessions map (same as in auth.ts)
export const sessions = new Map<string, Session>();

/**
 * Helper to extract session token from Authorization header (Bearer) or cookies
 * Priority: Bearer token > Cookie
 */
function getSessionToken(request: FastifyRequest): string | undefined {
  // 1. Check Authorization header for Bearer token
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7); // Remove "Bearer " prefix
    if (token) {
      return token;
    }
  }

  // 2. Fall back to checking cookies
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'sessionToken') {
      return decodeURIComponent(value);
    }
  }
  return undefined;
}

/**
 * Middleware to require authentication
 */
export function requireAuth(app: App): (request: FastifyRequest, reply: FastifyReply) => Promise<Session | null> {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<Session | null> => {
    const sessionToken = getSessionToken(request);

    if (!sessionToken || !sessions.has(sessionToken)) {
      app.logger.warn({}, 'Unauthorized: no valid session');
      reply.status(401).send({
        error: 'Authentification requise',
        errorCode: 'UNAUTHORIZED',
      });
      return null;
    }

    const session = sessions.get(sessionToken)!;

    // Verify user still exists in database
    const user = await app.db.select().from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (user.length === 0 || !user[0].isActive) {
      app.logger.warn({ userId: session.userId }, 'Unauthorized: user not found or not active');
      sessions.delete(sessionToken);
      reply.status(401).send({
        error: 'Authentification invalide',
        errorCode: 'INVALID_SESSION',
      });
      return null;
    }

    return session;
  };
}

/**
 * Middleware to require driver role
 */
export function requireDriver(app: App): (request: FastifyRequest, reply: FastifyReply, session: Session) => Promise<Session | null> {
  return async (request: FastifyRequest, reply: FastifyReply, session: Session): Promise<Session | null> => {
    if (session.role !== 'driver') {
      app.logger.warn({ userId: session.userId }, 'Forbidden: requires driver role');
      reply.status(403).send({
        error: 'Accès refusé. Rôle chauffeur requis',
        errorCode: 'FORBIDDEN',
      });
      return null;
    }
    return session;
  };
}

/**
 * Middleware to require team leader or admin role
 */
export function requireTeamLeaderOrAdmin(app: App): (request: FastifyRequest, reply: FastifyReply, session: Session) => Promise<Session | null> {
  return async (request: FastifyRequest, reply: FastifyReply, session: Session): Promise<Session | null> => {
    if (session.role !== 'team_leader' && session.role !== 'admin') {
      app.logger.warn({ userId: session.userId }, 'Forbidden: requires team_leader or admin role');
      reply.status(403).send({
        error: 'Accès refusé. Rôle chef d\'équipe ou administrateur requis',
        errorCode: 'FORBIDDEN',
      });
      return null;
    }
    return session;
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(app: App): (request: FastifyRequest, reply: FastifyReply, session: Session) => Promise<Session | null> {
  return async (request: FastifyRequest, reply: FastifyReply, session: Session): Promise<Session | null> => {
    if (session.role !== 'admin') {
      app.logger.warn({ userId: session.userId }, 'Forbidden: requires admin role');
      reply.status(403).send({
        error: 'Accès refusé. Rôle administrateur requis',
        errorCode: 'FORBIDDEN',
      });
      return null;
    }
    return session;
  };
}
