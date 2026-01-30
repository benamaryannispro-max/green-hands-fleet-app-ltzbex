import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, gte, desc } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireTeamLeaderOrAdmin } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // GET /api/alerts - Get all alerts for team leaders
  fastify.get("/api/alerts", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { type, startDate } = request.query as { type?: string; startDate?: string };
    app.logger.info({ type, startDate }, 'Fetching alerts');

    try {
      const conditions: any[] = [];
      if (type) conditions.push(eq(schema.alerts.type, type as any));
      if (startDate) conditions.push(gte(schema.alerts.createdAt, new Date(startDate)));

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

  // POST /api/alerts/:id/read - Mark alert as read
  fastify.post("/api/alerts/:id/read", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    app.logger.info({ alertId: id }, 'Marking alert as read');

    try {
      const [alert] = await app.db.update(schema.alerts)
        .set({ readAt: new Date() })
        .where(eq(schema.alerts.id, id))
        .returning();

      app.logger.info({ alertId: id }, 'Alert marked as read');
      return alert;
    } catch (error) {
      app.logger.error({ err: error, alertId: id }, 'Failed to mark alert as read');
      throw error;
    }
  });
}
