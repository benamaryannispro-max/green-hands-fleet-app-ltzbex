import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, or } from "drizzle-orm";
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

  // POST /api/users/drivers - Create a new driver
  fastify.post("/api/users/drivers", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { phone, firstName, lastName } = request.body as { phone: string; firstName: string; lastName: string };

    app.logger.info({ phone, firstName, lastName }, 'Creating new driver');

    try {
      const driverId = randomUUID();
      const [driver] = await app.db.insert(schema.users).values({
        id: driverId,
        phone,
        firstName,
        lastName,
        role: 'driver',
        isApproved: false,
        isActive: true,
      }).returning();

      // Generate driver_pending alert
      await app.db.insert(schema.alerts).values({
        id: randomUUID(),
        type: 'driver_pending',
        title: `Nouveau conducteur en attente d'approbation`,
        message: `${firstName} ${lastName} (${phone}) nécessite une approbation.`,
        payload: { driverId, phone, firstName, lastName },
      });

      app.logger.info({ driverId: driver.id, phone }, 'Driver created successfully with pending alert');
      return driver;
    } catch (error) {
      app.logger.error({ err: error, phone }, 'Failed to create driver');
      throw error;
    }
  });

  // GET /api/users/drivers - Get all drivers grouped by status
  fastify.get("/api/users/drivers", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    app.logger.info({}, 'Fetching drivers list');

    try {
      const allDrivers = await app.db.select().from(schema.users).where(eq(schema.users.role, 'driver'));

      const active = allDrivers.filter(d => d.isActive && d.isApproved);
      const pending = allDrivers.filter(d => d.isActive && !d.isApproved);
      const deleted = allDrivers.filter(d => !d.isActive);

      app.logger.info({ activeCount: active.length, pendingCount: pending.length, deletedCount: deleted.length }, 'Drivers list fetched');
      return { active, pending, deleted };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch drivers');
      throw error;
    }
  });

  // PUT /api/users/drivers/:id/approve - Approve a driver
  fastify.put("/api/users/drivers/:id/approve", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Approving driver');

    try {
      const [updated] = await app.db.update(schema.users)
        .set({ isApproved: true, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();

      if (!updated) {
        app.logger.warn({ driverId: id }, 'Driver not found');
        return reply.status(404).send({ error: 'Driver not found' });
      }

      app.logger.info({ driverId: id }, 'Driver approved successfully');
      return updated;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to approve driver');
      throw error;
    }
  });

  // PUT /api/users/drivers/:id/revoke - Revoke driver (deactivate)
  fastify.put("/api/users/drivers/:id/revoke", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Revoking driver');

    try {
      const [updated] = await app.db.update(schema.users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();

      if (!updated) {
        app.logger.warn({ driverId: id }, 'Driver not found');
        return reply.status(404).send({ error: 'Driver not found' });
      }

      app.logger.info({ driverId: id }, 'Driver revoked successfully');
      return updated;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to revoke driver');
      throw error;
    }
  });

  // PUT /api/users/drivers/:id/restore - Restore a revoked driver
  fastify.put("/api/users/drivers/:id/restore", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Restoring driver');

    try {
      const [updated] = await app.db.update(schema.users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();

      if (!updated) {
        app.logger.warn({ driverId: id }, 'Driver not found');
        return reply.status(404).send({ error: 'Driver not found' });
      }

      app.logger.info({ driverId: id }, 'Driver restored successfully');
      return updated;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to restore driver');
      throw error;
    }
  });
}
