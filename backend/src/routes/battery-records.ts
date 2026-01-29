import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, isNull } from "drizzle-orm";
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

  // POST /api/battery-records - Create a new battery record
  fastify.post("/api/battery-records", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireDriver(request, reply);
    if (!session) return;

    const body = request.body as {
      shiftId: string;
      type: 'departure' | 'return';
      count: number;
      photoUrl: string;
      comment: string;
      driverSignature: string;
    };

    app.logger.info({ shiftId: body.shiftId, type: body.type, count: body.count }, 'Creating battery record');

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
        return reply.status(403).send({ error: 'Forbidden: you can only create records for your own shifts' });
      }

      const [record] = await app.db.insert(schema.batteryRecords).values({
        shiftId: body.shiftId,
        type: body.type,
        count: body.count,
        photoUrl: body.photoUrl,
        comment: body.comment,
        driverSignature: body.driverSignature,
      }).returning();

      app.logger.info({ recordId: record.id, shiftId: body.shiftId }, 'Battery record created successfully');
      return record;
    } catch (error) {
      app.logger.error({ err: error, shiftId: body.shiftId }, 'Failed to create battery record');
      throw error;
    }
  });

  // PUT /api/battery-records/:id/sign - Sign a battery record as team leader
  fastify.put("/api/battery-records/:id/sign", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const { teamLeaderSignature } = request.body as { teamLeaderSignature: string };

    app.logger.info({ recordId: id }, 'Signing battery record');

    try {
      const record = await app.db.select().from(schema.batteryRecords)
        .where(eq(schema.batteryRecords.id, id))
        .limit(1);

      if (record.length === 0) {
        app.logger.warn({ recordId: id }, 'Battery record not found');
        return reply.status(404).send({ error: 'Battery record not found' });
      }

      const [updated] = await app.db.update(schema.batteryRecords)
        .set({ teamLeaderSignature })
        .where(eq(schema.batteryRecords.id, id))
        .returning();

      app.logger.info({ recordId: id }, 'Battery record signed successfully');
      return updated;
    } catch (error) {
      app.logger.error({ err: error, recordId: id }, 'Failed to sign battery record');
      throw error;
    }
  });

  // GET /api/battery-records/pending-signatures - Get records pending team leader signature
  fastify.get("/api/battery-records/pending-signatures", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    app.logger.info({}, 'Fetching battery records pending team leader signature');

    try {
      const pendingRecords = await app.db.select().from(schema.batteryRecords)
        .where(isNull(schema.batteryRecords.teamLeaderSignature));

      app.logger.info({ count: pendingRecords.length }, 'Pending battery records fetched');
      return pendingRecords;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch pending battery records');
      throw error;
    }
  });
}
