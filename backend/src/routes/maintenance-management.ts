import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, desc, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
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

  // POST /api/maintenance - Create maintenance record
  fastify.post("/api/maintenance", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { vehicleId, date, km, type, notes, status } = request.body as {
      vehicleId: string;
      date: string;
      km: number;
      type: 'révision' | 'réparation' | 'panne';
      notes: string;
      status: 'à faire' | 'en cours' | 'terminé';
    };

    app.logger.info({ vehicleId, type, status }, 'Creating maintenance record');

    try {
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, vehicleId))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      // Store as description in existing maintenanceLogs table
      const [record] = await app.db.insert(schema.maintenanceLogs).values({
        id: randomUUID(),
        vehicleId,
        description: `${type} - ${km}km - ${notes}`,
        performedBy: session.user.id,
        performedAt: new Date(date),
        notes: JSON.stringify({ date, km, type, status }),
      }).returning();

      // If status is 'terminé', generate repair_completed alert
      if (status === 'terminé') {
        await app.db.insert(schema.alerts).values({
          id: randomUUID(),
          type: 'repair_completed',
          title: `${vehicle[0].name} - Réparation terminée`,
          message: `La réparation pour ${vehicle[0].name} (${type}) a été marquée comme terminée.`,
          payload: { vehicleId, maintenanceId: record.id, type },
        });
      }

      app.logger.info({ recordId: record.id }, 'Maintenance record created');
      return { success: true, record };
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to create maintenance record');
      throw error;
    }
  });

  // GET /api/maintenance/vehicle/:vehicleId - Get maintenance history
  fastify.get("/api/maintenance/vehicle/:vehicleId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { vehicleId } = request.params as { vehicleId: string };
    app.logger.info({ vehicleId }, 'Fetching maintenance history');

    try {
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

      app.logger.info({ vehicleId, count: logs.length }, 'Maintenance history fetched');
      return logs.map(log => ({
        id: log.id,
        description: log.description,
        createdAt: log.performedAt,
        ...JSON.parse(log.notes || '{}')
      }));
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to fetch maintenance history');
      throw error;
    }
  });

  // PUT /api/maintenance/:id - Update maintenance record
  fastify.put("/api/maintenance/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const { date, km, type, notes, status } = request.body as {
      date?: string;
      km?: number;
      type?: string;
      notes?: string;
      status?: 'à faire' | 'en cours' | 'terminé';
    };

    app.logger.info({ recordId: id, status }, 'Updating maintenance record');

    try {
      const record = await app.db.select().from(schema.maintenanceLogs)
        .where(eq(schema.maintenanceLogs.id, id))
        .limit(1);

      if (record.length === 0) {
        app.logger.warn({ recordId: id }, 'Maintenance record not found');
        return reply.status(404).send({ error: 'Maintenance record not found' });
      }

      const oldData = JSON.parse(record[0].notes || '{}');
      const newData = { ...oldData, date, km, type, status };

      const [updated] = await app.db.update(schema.maintenanceLogs)
        .set({
          description: `${type || oldData.type} - ${km || oldData.km}km - ${notes || oldData.notes}`,
          notes: JSON.stringify(newData),
          performedAt: date ? new Date(date) : undefined,
        })
        .where(eq(schema.maintenanceLogs.id, id))
        .returning();

      // If status changed to 'terminé', generate repair_completed alert
      if (status === 'terminé' && oldData.status !== 'terminé') {
        await app.db.insert(schema.alerts).values({
          id: randomUUID(),
          type: 'repair_completed',
          title: 'Réparation terminée',
          message: `Une réparation a été marquée comme terminée.`,
          payload: { maintenanceId: id },
        });
      }

      app.logger.info({ recordId: id }, 'Maintenance record updated');
      return { success: true, record: updated };
    } catch (error) {
      app.logger.error({ err: error, recordId: id }, 'Failed to update maintenance record');
      throw error;
    }
  });

  // GET /api/maintenance/alerts - Get maintenance alerts based on km thresholds
  fastify.get("/api/maintenance/alerts", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    app.logger.info({}, 'Fetching maintenance alerts');

    try {
      const alerts = await app.db.select().from(schema.maintenanceAlerts)
        .orderBy(desc(schema.maintenanceAlerts.createdAt));

      app.logger.info({ count: alerts.length }, 'Maintenance alerts fetched');
      return alerts;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch maintenance alerts');
      throw error;
    }
  });

  // POST /api/maintenance/configure-thresholds - Configure km thresholds
  fastify.post("/api/maintenance/configure-thresholds", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { vehicleId, thresholds } = request.body as {
      vehicleId: string;
      thresholds: Array<{ type: string; kmInterval: number }>;
    };

    app.logger.info({ vehicleId, thresholdCount: thresholds.length }, 'Configuring maintenance thresholds');

    try {
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, vehicleId))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      // Get latest km from maintenance logs
      const latestLog = await app.db.select().from(schema.maintenanceLogs)
        .where(eq(schema.maintenanceLogs.vehicleId, vehicleId))
        .orderBy(desc(schema.maintenanceLogs.performedAt))
        .limit(1);

      let currentKm = 0;
      if (latestLog.length > 0) {
        const data = JSON.parse(latestLog[0].notes || '{}');
        currentKm = data.km || 0;
      }

      // Generate alerts for upcoming maintenance
      for (const threshold of thresholds) {
        const nextMaintenanceKm = currentKm + threshold.kmInterval;
        const kmRemaining = nextMaintenanceKm - currentKm;

        if (kmRemaining < 1000) { // Alert if less than 1000km remaining
          await app.db.insert(schema.maintenanceAlerts).values({
            id: randomUUID(),
            vehicleId,
            alertType: 'upcoming_service',
            thresholdKm: nextMaintenanceKm,
            currentKm,
            message: `${vehicle[0].name} will need ${threshold.type} maintenance in approximately ${kmRemaining}km`,
          });
        }
      }

      app.logger.info({ vehicleId }, 'Maintenance thresholds configured');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, vehicleId }, 'Failed to configure thresholds');
      throw error;
    }
  });
}
