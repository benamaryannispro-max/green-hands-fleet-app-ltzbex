import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireTeamLeaderOrAdmin } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // POST /api/maintenance - Create maintenance record
  fastify.post("/api/maintenance", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { vehicleId, description, cost, notes } = request.body as {
      vehicleId: string;
      description: string;
      cost?: number;
      notes?: string;
    };

    app.logger.info({ vehicleId, description }, 'Creating maintenance record');

    try {
      const [log] = await app.db.insert(schema.maintenanceLogs).values({
        id: randomUUID(),
        vehicleId,
        description,
        performedBy: session.userId,
        performedAt: new Date(),
        cost: cost ? cost.toString() : null,
        notes: notes || null,
      }).returning();

      app.logger.info({ logId: log.id, vehicleId }, 'Maintenance record created successfully');
      return log;
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to create maintenance record');
      throw error;
    }
  });

  // GET /api/maintenance/vehicle/:vehicleId - Get maintenance records for vehicle
  fastify.get("/api/maintenance/vehicle/:vehicleId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const { vehicleId } = request.params as { vehicleId: string };
    app.logger.info({ vehicleId }, 'Fetching maintenance records');

    try {
      const logs = await app.db.select().from(schema.maintenanceLogs)
        .where(eq(schema.maintenanceLogs.vehicleId, vehicleId))
        .orderBy(desc(schema.maintenanceLogs.performedAt));

      app.logger.info({ vehicleId, count: logs.length }, 'Maintenance records fetched');
      return logs;
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to fetch maintenance records');
      throw error;
    }
  });

  // GET /api/maintenance/recent - Get recent maintenance logs
  fastify.get("/api/maintenance/recent", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    app.logger.info({}, 'Fetching recent maintenance records');

    try {
      const logs = await app.db.select().from(schema.maintenanceLogs)
        .orderBy(desc(schema.maintenanceLogs.performedAt));

      app.logger.info({ count: logs.length }, 'Recent maintenance records fetched');
      return logs;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch recent maintenance records');
      throw error;
    }
  });
}
