import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { sessions } from "../utils/auth.js";
import type { Session } from "../utils/auth.js";

/**
 * Generate a random session token
 */
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * POST /api/auth/sign-in/email
   * Sign in as team leader with email and password
   */
  fastify.post('/api/auth/sign-in/email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email?: string; password?: string };

    app.logger.info({ email }, 'Team leader sign-in attempt');

    try {
      if (!email || !password) {
        app.logger.warn({ email }, 'Missing email or password');
        return reply.status(400).send({
          error: 'Email et mot de passe requis',
          errorCode: 'INVALID_INPUT',
        });
      }

      // Find user by email
      const user = await app.db.select().from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (user.length === 0) {
        app.logger.warn({ email }, 'User not found');
        return reply.status(401).send({
          error: 'Email ou mot de passe incorrect',
          errorCode: 'INVALID_CREDENTIALS',
        });
      }

      const foundUser = user[0];

      // Check if user role is team_leader or admin
      if (foundUser.role !== 'team_leader' && foundUser.role !== 'admin') {
        app.logger.warn({ email, role: foundUser.role }, 'User role does not allow email/password login');
        return reply.status(403).send({
          error: 'Accès refusé. Veuillez utiliser la connexion par téléphone',
          errorCode: 'FORBIDDEN_LOGIN_METHOD',
        });
      }

      // Verify password
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.compare(password, foundUser.password || '');

      if (!passwordMatch) {
        app.logger.warn({ email }, 'Invalid password');
        return reply.status(401).send({
          error: 'Email ou mot de passe incorrect',
          errorCode: 'INVALID_CREDENTIALS',
        });
      }

      // Create session
      const sessionToken = generateSessionToken();
      const session: Session = {
        userId: foundUser.id,
        email: foundUser.email || undefined,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        role: foundUser.role as 'driver' | 'team_leader' | 'admin',
        isApproved: foundUser.isApproved,
        isActive: foundUser.isActive,
        createdAt: new Date(),
      };

      sessions.set(sessionToken, session);

      app.logger.info({ userId: foundUser.id, email, role: foundUser.role }, 'Team leader signed in successfully');

      // Set session cookie
      const cookieOptions = [
        `sessionToken=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        'Max-Age=' + (24 * 60 * 60), // 24 hours in seconds
        'SameSite=Lax'
      ].join('; ');
      reply.header('Set-Cookie', cookieOptions);

      return {
        success: true,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          role: foundUser.role,
          isApproved: foundUser.isApproved,
          isActive: foundUser.isActive,
        },
        sessionToken,
      };
    } catch (error) {
      app.logger.error({ err: error, email }, 'Error during email sign-in');
      throw error;
    }
  });

  /**
   * POST /api/auth/sign-in/phone
   * Sign in as driver with phone number only
   */
  fastify.post('/api/auth/sign-in/phone', async (request: FastifyRequest, reply: FastifyReply) => {
    const { phone } = request.body as { phone?: string };

    app.logger.info({ phone }, 'Driver sign-in attempt by phone');

    try {
      if (!phone) {
        app.logger.warn({}, 'Missing phone number');
        return reply.status(400).send({
          error: 'Numéro de téléphone requis',
          errorCode: 'INVALID_INPUT',
        });
      }

      // Find user by phone
      const user = await app.db.select().from(schema.users)
        .where(eq(schema.users.phone, phone))
        .limit(1);

      if (user.length === 0) {
        app.logger.warn({ phone }, 'User not found by phone');
        return reply.status(404).send({
          error: 'Numéro de téléphone non reconnu',
          errorCode: 'USER_NOT_FOUND',
        });
      }

      const foundUser = user[0];

      // Check if user is approved
      if (!foundUser.isApproved) {
        app.logger.warn({ phone, userId: foundUser.id }, 'User not approved');
        return reply.status(403).send({
          error: 'Votre compte est en attente d\'approbation',
          errorCode: 'NOT_APPROVED',
        });
      }

      // Check if user is active
      if (!foundUser.isActive) {
        app.logger.warn({ phone, userId: foundUser.id }, 'User not active');
        return reply.status(403).send({
          error: 'Votre compte a été désactivé',
          errorCode: 'NOT_ACTIVE',
        });
      }

      // Create session
      const sessionToken = generateSessionToken();
      const session: Session = {
        userId: foundUser.id,
        phone: foundUser.phone || undefined,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        role: foundUser.role as 'driver' | 'team_leader' | 'admin',
        isApproved: foundUser.isApproved,
        isActive: foundUser.isActive,
        createdAt: new Date(),
      };

      sessions.set(sessionToken, session);

      app.logger.info({ userId: foundUser.id, phone, role: foundUser.role }, 'Driver signed in successfully');

      // Set session cookie
      const cookieOptions = [
        `sessionToken=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        'Max-Age=' + (24 * 60 * 60), // 24 hours in seconds
        'SameSite=Lax'
      ].join('; ');
      reply.header('Set-Cookie', cookieOptions);

      return {
        success: true,
        user: {
          id: foundUser.id,
          phone: foundUser.phone,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          role: foundUser.role,
          isApproved: foundUser.isApproved,
          isActive: foundUser.isActive,
        },
        sessionToken,
      };
    } catch (error) {
      app.logger.error({ err: error, phone }, 'Error during phone sign-in');
      throw error;
    }
  });

  /**
   * GET /api/auth/session
   * Get current session information
   */
  fastify.get('/api/auth/session', async (request: FastifyRequest, reply: FastifyReply) => {
    // Helper to extract session token from Authorization header (Bearer) or cookies
    const getSessionToken = (req: FastifyRequest): string | undefined => {
      // 1. Check Authorization header for Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7); // Remove "Bearer " prefix
        if (token) {
          return token;
        }
      }

      // 2. Fall back to checking cookies
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) return undefined;
      const cookies = cookieHeader.split(';').map(c => c.trim());
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'sessionToken') {
          return decodeURIComponent(value);
        }
      }
      return undefined;
    };

    const sessionToken = getSessionToken(request);

    app.logger.info({ sessionToken: sessionToken ? 'present' : 'missing' }, 'Session check');

    try {
      if (!sessionToken || !sessions.has(sessionToken)) {
        app.logger.warn({}, 'No valid session found');
        return reply.status(401).send({
          error: 'Aucune session active',
          errorCode: 'NO_SESSION',
        });
      }

      const session = sessions.get(sessionToken)!;

      // Find user in database to get latest info
      const user = await app.db.select().from(schema.users)
        .where(eq(schema.users.id, session.userId))
        .limit(1);

      if (user.length === 0) {
        app.logger.warn({ sessionToken }, 'User not found for session');
        sessions.delete(sessionToken);
        return reply.status(401).send({
          error: 'Utilisateur introuvable',
          errorCode: 'USER_NOT_FOUND',
        });
      }

      const foundUser = user[0];

      app.logger.info({ userId: foundUser.id }, 'Session retrieved successfully');

      return {
        success: true,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          phone: foundUser.phone,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          role: foundUser.role,
          isApproved: foundUser.isApproved,
          isActive: foundUser.isActive,
        },
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Error retrieving session');
      throw error;
    }
  });

  /**
   * POST /api/auth/sign-out
   * Sign out the current user
   */
  fastify.post('/api/auth/sign-out', async (request: FastifyRequest, reply: FastifyReply) => {
    // Helper to extract session token from Authorization header (Bearer) or cookies
    const getSessionToken = (req: FastifyRequest): string | undefined => {
      // 1. Check Authorization header for Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7); // Remove "Bearer " prefix
        if (token) {
          return token;
        }
      }

      // 2. Fall back to checking cookies
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) return undefined;
      const cookies = cookieHeader.split(';').map(c => c.trim());
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'sessionToken') {
          return decodeURIComponent(value);
        }
      }
      return undefined;
    };

    const sessionToken = getSessionToken(request);

    app.logger.info({ sessionToken: sessionToken ? 'present' : 'missing' }, 'Sign-out attempt');

    try {
      if (sessionToken) {
        const session = sessions.get(sessionToken);
        if (session) {
          app.logger.info({ userId: session.userId }, 'User signed out');
        }
        sessions.delete(sessionToken);
      }

      // Clear session cookie
      const clearCookie = 'sessionToken=; Path=/; Max-Age=0; SameSite=Lax';
      reply.header('Set-Cookie', clearCookie);

      return {
        success: true,
        message: 'Déconnexion réussie',
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Error during sign-out');
      throw error;
    }
  });
}
