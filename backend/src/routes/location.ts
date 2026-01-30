import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireDriver, requireTeamLeaderOrAdmin } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkDriver = requireDriver(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // POST /api/location/update - Update driver location
  fastify.post("/api/location/update", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkDriver(request, reply, session);
    if (!sessionCheck) return;

    const body = request.body as {
      shiftId: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp: string;
    };

    app.logger.info({ shiftId: body.shiftId, latitude: body.latitude, longitude: body.longitude }, 'Updating location');

    try {
      // Verify shift exists and belongs to driver
      const shift = await app.db.select().from(schema.shifts)
        .where(eq(schema.shifts.id, body.shiftId))
        .limit(1);

      if (shift.length === 0) {
        app.logger.warn({ shiftId: body.shiftId }, 'Shift not found');
        return reply.status(404).send({ error: 'Shift not found' });
      }

      if (shift[0].driverId !== session.userId) {
        app.logger.warn({ shiftId: body.shiftId, userId: session.userId }, 'Driver does not own this shift');
        return reply.status(403).send({ error: 'Forbidden: you can only update location for your own shifts' });
      }

      await app.db.insert(schema.locationUpdates).values({
        id: randomUUID(),
        shiftId: body.shiftId,
        driverId: session.userId,
        latitude: String(body.latitude),
        longitude: String(body.longitude),
        accuracy: body.accuracy ? String(body.accuracy) : null,
        timestamp: new Date(body.timestamp),
      });

      app.logger.info({ shiftId: body.shiftId }, 'Location updated successfully');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, shiftId: body.shiftId }, 'Failed to update location');
      throw error;
    }
  });

  // GET /api/location/fleet - Get fleet locations (team leader/admin only)
  fastify.get("/api/location/fleet", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    app.logger.info({}, 'Fetching fleet locations');

    try {
      const locations = await app.db.select().from(schema.locationUpdates)
        .orderBy(desc(schema.locationUpdates.timestamp));

      app.logger.info({ count: locations.length }, 'Fleet locations fetched');
      return locations;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch fleet locations');
      throw error;
    }
  });

  // GET /api/location/history/:driverId - Get driver location history
  fastify.get("/api/location/history/:driverId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const { driverId } = request.params as { driverId: string };
    app.logger.info({ driverId }, 'Fetching location history');

    try {
      const locations = await app.db.select().from(schema.locationUpdates)
        .where(eq(schema.locationUpdates.driverId, driverId))
        .orderBy(desc(schema.locationUpdates.timestamp));

      app.logger.info({ driverId, count: locations.length }, 'Location history fetched');
      return locations;
    } catch (error) {
      app.logger.error({ err: error, driverId }, 'Failed to fetch location history');
      throw error;
    }
  });
}
