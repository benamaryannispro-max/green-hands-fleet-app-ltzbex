import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, gte, lte } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireTeamLeaderOrAdmin } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // GET /api/reports/failed-inspections - Get failed inspection report
  fastify.get("/api/reports/failed-inspections", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
    app.logger.info({ startDate, endDate }, 'Fetching failed inspections report');

    try {
      const conditions: any[] = [];
      if (startDate) conditions.push(gte(schema.inspections.completedAt, new Date(startDate)));
      if (endDate) conditions.push(lte(schema.inspections.completedAt, new Date(endDate)));

      const failedInspections = await app.db.select().from(schema.inspections)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Filter failed inspections (where any safety item is missing)
      const failed = failedInspections.filter(i =>
        !i.trousseSecours || !i.roueSecours || !i.extincteur || !i.boosterBatterie
      );

      app.logger.info({ count: failed.length }, 'Failed inspections report generated');
      return {
        total: failedInspections.length,
        failed: failed.length,
        inspections: failed,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to generate failed inspections report');
      throw error;
    }
  });

  // GET /api/reports/failed-inspections/export - Export failed inspections report
  fastify.get("/api/reports/failed-inspections/export", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
    app.logger.info({ startDate, endDate }, 'Exporting failed inspections report');

    try {
      const conditions: any[] = [];
      if (startDate) conditions.push(gte(schema.inspections.completedAt, new Date(startDate)));
      if (endDate) conditions.push(lte(schema.inspections.completedAt, new Date(endDate)));

      const failedInspections = await app.db.select().from(schema.inspections)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Filter failed inspections
      const failed = failedInspections.filter(i =>
        !i.trousseSecours || !i.roueSecours || !i.extincteur || !i.boosterBatterie
      );

      const json = JSON.stringify({
        exportDate: new Date().toISOString(),
        total: failedInspections.length,
        failed: failed.length,
        inspections: failed,
      }, null, 2);

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', 'attachment; filename="failed-inspections-report.json"');
      app.logger.info({ count: failed.length }, 'Report exported successfully');
      return reply.send(json);
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to export report');
      throw error;
    }
  });
}
