import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { App } from "../index.js";

/**
 * Register authentication logging hooks for debugging
 * Logs sign-in attempts, user lookups, and authentication results
 */
export function register(app: App, fastify: FastifyInstance) {
  // Log all requests to auth endpoints
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url.startsWith('/api/auth/sign-in')) {
      const body = request.body as Record<string, any>;
      app.logger.info(
        {
          method: request.method,
          url: request.url,
          email: body?.email || body?.phone,
          timestamp: new Date().toISOString(),
        },
        'Authentication attempt received'
      );
    }

    if (request.url.startsWith('/api/auth/get-session')) {
      app.logger.info(
        {
          method: request.method,
          url: request.url,
          timestamp: new Date().toISOString(),
        },
        'Session check request received'
      );
    }
  });

  // Log auth responses
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url.startsWith('/api/auth/sign-in')) {
      const statusCode = reply.statusCode;
      app.logger.info(
        {
          method: request.method,
          url: request.url,
          statusCode,
          timestamp: new Date().toISOString(),
          success: statusCode >= 200 && statusCode < 300,
        },
        `Authentication response: ${statusCode >= 200 && statusCode < 300 ? 'SUCCESS' : 'FAILED'}`
      );
    }

    if (request.url.startsWith('/api/auth/get-session')) {
      const statusCode = reply.statusCode;
      app.logger.info(
        {
          method: request.method,
          url: request.url,
          statusCode,
          timestamp: new Date().toISOString(),
        },
        'Session check response'
      );
    }
  });
}
