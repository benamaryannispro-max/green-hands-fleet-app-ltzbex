import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireDriver } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkDriver = requireDriver(app);

  // POST /api/shifts/start - Start a new shift
  fastify.post("/api/shifts/start", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkDriver(request, reply, session);
    if (!sessionCheck) return;

    const { vehicleId } = request.body as { vehicleId?: string };
    const driverId = session.userId;

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
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkDriver(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    const driverId = session.userId;

    app.logger.info({ shiftId: id, driverId }, 'Ending shift');

    try {
      const shift = await app.db.select().from(schema.shifts).where(eq(schema.shifts.id, id)).limit(1);
      if (shift.length === 0) {
        app.logger.warn({ shiftId: id }, 'Shift not found');
        return reply.status(404).send({ error: 'Shift not found' });
      }

      if (shift[0].driverId !== driverId) {
        app.logger.warn({ shiftId: id, driverId }, 'Driver does not own this shift');
        return reply.status(403).send({ error: 'Forbidden: you can only end your own shifts' });
      }

      const [updatedShift] = await app.db.update(schema.shifts)
        .set({ endTime: new Date(), status: 'completed' })
        .where(eq(schema.shifts.id, id))
        .returning();

      app.logger.info({ shiftId: updatedShift.id }, 'Shift ended successfully');
      return updatedShift;
    } catch (error) {
      app.logger.error({ err: error, shiftId: id }, 'Failed to end shift');
      throw error;
    }
  });

  // GET /api/shifts/history - Get current driver's shift history
  fastify.get("/api/shifts/history", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkDriver(request, reply, session);
    if (!sessionCheck) return;

    const driverId = session.userId;
    app.logger.info({ driverId }, 'Fetching shift history');

    try {
      const shifts = await app.db.select().from(schema.shifts)
        .where(eq(schema.shifts.driverId, driverId))
        .orderBy(schema.shifts.startTime);

      app.logger.info({ driverId, count: shifts.length }, 'Shift history fetched');
      return shifts;
    } catch (error) {
      app.logger.error({ err: error, driverId }, 'Failed to fetch shift history');
      throw error;
    }
  });
}
