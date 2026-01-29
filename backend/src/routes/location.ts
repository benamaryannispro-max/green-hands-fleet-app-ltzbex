import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, desc } from "drizzle-orm";
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

  // POST /api/location/update - Update driver location
  fastify.post("/api/location/update", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireDriver(request, reply);
    if (!session) return;

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

      if (shift[0].driverId !== session.user.id) {
        app.logger.warn({ shiftId: body.shiftId, userId: session.user.id }, 'Driver does not own this shift');
        return reply.status(403).send({ error: 'Forbidden: you can only update location for your own shifts' });
      }

      await app.db.insert(schema.locationUpdates).values({
        shiftId: body.shiftId,
        driverId: session.user.id,
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
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    app.logger.info({}, 'Fetching fleet locations');

    try {
      // Get the latest location for each active shift
      const activeShifts = await app.db.select().from(schema.shifts)
        .where(eq(schema.shifts.status, 'active'));

      const fleetLocations = await Promise.all(
        activeShifts.map(async (shift) => {
          const latestLocation = await app.db.select().from(schema.locationUpdates)
            .where(eq(schema.locationUpdates.shiftId, shift.id))
            .orderBy(desc(schema.locationUpdates.timestamp))
            .limit(1);

          if (latestLocation.length === 0) return null;

          const driver = await app.db.select().from(schema.users)
            .where(eq(schema.users.id, shift.driverId))
            .limit(1);

          if (driver.length === 0) return null;

          return {
            driverId: driver[0].id,
            firstName: driver[0].firstName,
            lastName: driver[0].lastName,
            latitude: latestLocation[0].latitude,
            longitude: latestLocation[0].longitude,
            timestamp: latestLocation[0].timestamp,
            shiftId: shift.id,
          };
        })
      );

      const filtered = fleetLocations.filter(Boolean);
      app.logger.info({ count: filtered.length }, 'Fleet locations fetched');
      return filtered;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch fleet locations');
      throw error;
    }
  });

  // GET /api/location/driver/:driverId - Get latest location for a specific driver
  fastify.get("/api/location/driver/:driverId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { driverId } = request.params as { driverId: string };
    app.logger.info({ driverId }, 'Fetching driver location');

    try {
      // Get driver's active shift
      const activeShift = await app.db.select().from(schema.shifts)
        .where(and(eq(schema.shifts.driverId, driverId), eq(schema.shifts.status, 'active')))
        .limit(1);

      if (activeShift.length === 0) {
        app.logger.warn({ driverId }, 'No active shift for driver');
        return reply.status(404).send({ error: 'No active shift for this driver' });
      }

      const latestLocation = await app.db.select().from(schema.locationUpdates)
        .where(eq(schema.locationUpdates.shiftId, activeShift[0].id))
        .orderBy(desc(schema.locationUpdates.timestamp))
        .limit(1);

      if (latestLocation.length === 0) {
        app.logger.warn({ driverId }, 'No location data found');
        return reply.status(404).send({ error: 'No location data found for this driver' });
      }

      app.logger.info({ driverId }, 'Driver location fetched');
      return latestLocation[0];
    } catch (error) {
      app.logger.error({ err: error, driverId }, 'Failed to fetch driver location');
      throw error;
    }
  });
}
