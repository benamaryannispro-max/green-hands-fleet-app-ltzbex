import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();
  const requireDriver = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return null;
    if (session.user.role !== 'driver') {
      app.logger.warn({ userId: session.user.id }, 'Unauthorized: requires driver role');
      reply.status(403).send({ error: 'Forbidden: requires driver role' });
      return null;
    }
    return session;
  };

  // POST /api/shifts/start - Start a new shift
  fastify.post("/api/shifts/start", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireDriver(request, reply);
    if (!session) return;

    const { vehicleId } = request.body as { vehicleId?: string };
    const driverId = session.user.id;

    app.logger.info({ driverId, vehicleId }, 'Starting new shift');

    try {
      // Check if driver has an active shift
      const existingShift = await app.db.select().from(schema.shifts)
        .where(and(eq(schema.shifts.driverId, driverId), eq(schema.shifts.status, 'active')))
        .limit(1);

      if (existingShift.length > 0) {
        app.logger.warn({ driverId, shiftId: existingShift[0].id }, 'Driver already has an active shift');
        return reply.status(400).send({ error: 'Driver already has an active shift' });
      }

      if (vehicleId) {
        const vehicle = await app.db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId)).limit(1);
        if (vehicle.length === 0) {
          app.logger.warn({ vehicleId }, 'Vehicle not found');
          return reply.status(404).send({ error: 'Vehicle not found' });
        }
      }

      const [shift] = await app.db.insert(schema.shifts).values({
        driverId,
        vehicleId: vehicleId || null,
        startTime: new Date(),
        status: 'active',
      }).returning();

      app.logger.info({ shiftId: shift.id, driverId }, 'Shift started successfully');
      return shift;
    } catch (error) {
      app.logger.error({ err: error, driverId }, 'Failed to start shift');
      throw error;
    }
  });

  // PUT /api/shifts/:id/end - End a shift
  fastify.put("/api/shifts/:id/end", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireDriver(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const driverId = session.user.id;

    app.logger.info({ shiftId: id, driverId }, 'Ending shift');

    try {
      const shift = await app.db.select().from(schema.shifts).where(eq(schema.shifts.id, id)).limit(1);
      if (shift.length === 0) {
        app.logger.warn({ shiftId: id }, 'Shift not found');
        return reply.status(404).send({ error: 'Shift not found' });
      }

      if (shift[0].driverId !== driverId) {
        app.logger.warn({ shiftId: id, driverId, ownerId: shift[0].driverId }, 'Driver does not own this shift');
        return reply.status(403).send({ error: 'Forbidden: you can only end your own shifts' });
      }

      if (shift[0].status !== 'active') {
        app.logger.warn({ shiftId: id, status: shift[0].status }, 'Shift is not active');
        return reply.status(400).send({ error: 'Shift is not active' });
      }

      // Check if return inspection exists
      const returnInspection = await app.db.select().from(schema.inspections)
        .where(and(eq(schema.inspections.shiftId, id), eq(schema.inspections.type, 'return')))
        .limit(1);

      if (returnInspection.length === 0) {
        app.logger.warn({ shiftId: id }, 'Return inspection not completed');
        return reply.status(400).send({ error: 'Return inspection not completed' });
      }

      // Check if return battery record exists
      const returnBatteryRecord = await app.db.select().from(schema.batteryRecords)
        .where(and(eq(schema.batteryRecords.shiftId, id), eq(schema.batteryRecords.type, 'return')))
        .limit(1);

      if (returnBatteryRecord.length === 0) {
        app.logger.warn({ shiftId: id }, 'Return battery record not completed');
        return reply.status(400).send({ error: 'Return battery record not completed' });
      }

      const [updated] = await app.db.update(schema.shifts)
        .set({ status: 'completed', endTime: new Date() })
        .where(eq(schema.shifts.id, id))
        .returning();

      app.logger.info({ shiftId: id, driverId }, 'Shift ended successfully');
      return updated;
    } catch (error) {
      app.logger.error({ err: error, shiftId: id }, 'Failed to end shift');
      throw error;
    }
  });

  // GET /api/shifts/active - Get active shift for current driver
  fastify.get("/api/shifts/active", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireDriver(request, reply);
    if (!session) return;

    const driverId = session.user.id;
    app.logger.info({ driverId }, 'Fetching active shift');

    try {
      const activeShift = await app.db.select().from(schema.shifts)
        .where(and(eq(schema.shifts.driverId, driverId), eq(schema.shifts.status, 'active')))
        .limit(1);

      app.logger.info({ driverId, found: activeShift.length > 0 }, 'Active shift fetched');
      return activeShift.length > 0 ? activeShift[0] : null;
    } catch (error) {
      app.logger.error({ err: error, driverId }, 'Failed to fetch active shift');
      throw error;
    }
  });

  // GET /api/shifts/history - Get shift history
  fastify.get("/api/shifts/history", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id, role: session.user.role }, 'Fetching shift history');

    try {
      let shifts;
      if (session.user.role === 'driver') {
        shifts = await app.db.select().from(schema.shifts)
          .where(eq(schema.shifts.driverId, session.user.id));
      } else {
        shifts = await app.db.select().from(schema.shifts);
      }

      app.logger.info({ userId: session.user.id, count: shifts.length }, 'Shift history fetched');
      return shifts;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch shift history');
      throw error;
    }
  });
}
