import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, desc } from "drizzle-orm";
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

  // POST /api/maintenance - Create a new maintenance log
  fastify.post("/api/maintenance", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { vehicleId, description, cost, notes } = request.body as {
      vehicleId: string;
      description: string;
      cost?: number;
      notes?: string;
    };

    app.logger.info({ vehicleId, description }, 'Creating maintenance log');

    try {
      // Verify vehicle exists
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, vehicleId))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      const [maintenanceLog] = await app.db.insert(schema.maintenanceLogs).values({
        vehicleId,
        description,
        performedBy: session.user.id,
        performedAt: new Date(),
        cost: cost ? cost.toString() : null,
        notes: notes || null,
      }).returning();

      app.logger.info({ logId: maintenanceLog.id, vehicleId }, 'Maintenance log created successfully');
      return maintenanceLog;
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to create maintenance log');
      throw error;
    }
  });

  // GET /api/maintenance/vehicle/:vehicleId - Get maintenance logs for a vehicle
  fastify.get("/api/maintenance/vehicle/:vehicleId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { vehicleId } = request.params as { vehicleId: string };
    app.logger.info({ vehicleId }, 'Fetching maintenance logs for vehicle');

    try {
      // Verify vehicle exists
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, vehicleId))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      const logs = await app.db.select().from(schema.maintenanceLogs)
        .where(eq(schema.maintenanceLogs.vehicleId, vehicleId))
        .orderBy(desc(schema.maintenanceLogs.performedAt));

      app.logger.info({ vehicleId, count: logs.length }, 'Maintenance logs fetched');
      return logs;
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to fetch maintenance logs');
      throw error;
    }
  });

  // GET /api/maintenance/recent - Get recent maintenance logs across all vehicles
  fastify.get("/api/maintenance/recent", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    app.logger.info({}, 'Fetching recent maintenance logs');

    try {
      const logs = await app.db.select().from(schema.maintenanceLogs)
        .orderBy(desc(schema.maintenanceLogs.performedAt));

      app.logger.info({ count: logs.length }, 'Recent maintenance logs fetched');
      return logs;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch maintenance logs');
      throw error;
    }
  });
}
