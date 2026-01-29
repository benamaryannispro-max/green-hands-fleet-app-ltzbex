import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, gte, lte, desc, isNull } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();
  const requireTeamLeaderOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return null;
    if (session.user.role !== 'team_leader' && session.user.role !== 'admin') {
      app.logger.warn({ userId: session.user.id }, 'Unauthorized: requires team_leader or admin role');
      reply.status(403).send({ error: 'Forbidden: requires team_leader or admin role' });
      return null;
    }
    return session;
  };

  // GET /api/alerts - Get all alerts for team leaders
  fastify.get("/api/alerts", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { type, startDate, endDate } = request.query as { type?: string; startDate?: string; endDate?: string };
    app.logger.info({ type, startDate, endDate }, 'Fetching alerts');

    try {
      const conditions: any[] = [];

      if (type) {
        conditions.push(eq(schema.alerts.type, type as any));
      }

      if (startDate) {
        conditions.push(gte(schema.alerts.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(schema.alerts.createdAt, new Date(endDate)));
      }

      const alerts = await app.db.select().from(schema.alerts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.alerts.createdAt));

      app.logger.info({ count: alerts.length }, 'Alerts fetched');
      return alerts;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch alerts');
      throw error;
    }
  });

  // PUT /api/alerts/:id/read - Mark alert as read
  fastify.put("/api/alerts/:id/read", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    app.logger.info({ alertId: id }, 'Marking alert as read');

    try {
      const alert = await app.db.select().from(schema.alerts)
        .where(eq(schema.alerts.id, id))
        .limit(1);

      if (alert.length === 0) {
        app.logger.warn({ alertId: id }, 'Alert not found');
        return reply.status(404).send({ error: 'Alert not found' });
      }

      const [updated] = await app.db.update(schema.alerts)
        .set({ readAt: new Date() })
        .where(eq(schema.alerts.id, id))
        .returning();

      app.logger.info({ alertId: id }, 'Alert marked as read');
      return { success: true, alert: updated };
    } catch (error) {
      app.logger.error({ err: error, alertId: id }, 'Failed to mark alert as read');
      throw error;
    }
  });

  // POST /api/alerts/generate - Auto-generate alerts
  fastify.post("/api/alerts/generate", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { type, title, message, payload, userId } = request.body as {
      type: string;
      title: string;
      message: string;
      payload?: Record<string, any>;
      userId?: string;
    };

    app.logger.info({ type, title }, 'Generating alert');

    try {
      const [alert] = await app.db.insert(schema.alerts).values({
        type: type as any,
        title,
        message,
        payload: payload || null,
        userId: userId || null,
      }).returning();

      app.logger.info({ alertId: alert.id }, 'Alert generated successfully');
      return { success: true, alert };
    } catch (error) {
      app.logger.error({ err: error, type }, 'Failed to generate alert');
      throw error;
    }
  });
}
