import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireTeamLeaderOrAdmin, sessions } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // POST /api/users/drivers - Create a new driver
  fastify.post("/api/users/drivers", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

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
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

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
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Approving driver');

    try {
      const [updatedDriver] = await app.db.update(schema.users)
        .set({ isApproved: true })
        .where(eq(schema.users.id, id))
        .returning();

      app.logger.info({ driverId: updatedDriver.id }, 'Driver approved successfully');
      return updatedDriver;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to approve driver');
      throw error;
    }
  });

  // PUT /api/users/drivers/:id/revoke - Revoke driver approval
  fastify.put("/api/users/drivers/:id/revoke", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Revoking driver approval');

    try {
      const [updatedDriver] = await app.db.update(schema.users)
        .set({ isApproved: false })
        .where(eq(schema.users.id, id))
        .returning();

      app.logger.info({ driverId: updatedDriver.id }, 'Driver approval revoked successfully');
      return updatedDriver;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to revoke driver approval');
      throw error;
    }
  });

  // PUT /api/users/drivers/:id/restore - Restore deleted driver
  fastify.put("/api/users/drivers/:id/restore", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Restoring driver');

    try {
      const [updatedDriver] = await app.db.update(schema.users)
        .set({ isActive: true })
        .where(eq(schema.users.id, id))
        .returning();

      app.logger.info({ driverId: updatedDriver.id }, 'Driver restored successfully');
      return updatedDriver;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to restore driver');
      throw error;
    }
  });

  // DELETE /api/users/drivers/:id - Soft delete driver
  fastify.delete("/api/users/drivers/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    app.logger.info({ driverId: id }, 'Deleting driver');

    try {
      const [updatedDriver] = await app.db.update(schema.users)
        .set({ isActive: false })
        .where(eq(schema.users.id, id))
        .returning();

      app.logger.info({ driverId: updatedDriver.id }, 'Driver deleted successfully');
      return updatedDriver;
    } catch (error) {
      app.logger.error({ err: error, driverId: id }, 'Failed to delete driver');
      throw error;
    }
  });
}
