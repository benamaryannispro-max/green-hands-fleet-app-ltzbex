import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireDriver, requireTeamLeaderOrAdmin } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkDriver = requireDriver(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // POST /api/battery-records - Create battery record
  fastify.post("/api/battery-records", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkDriver(request, reply, session);
    if (!sessionCheck) return;

    const { shiftId, type, count, photoUrl, comment } = request.body as {
      shiftId: string;
      type: 'departure' | 'return';
      count: number;
      photoUrl: string;
      comment: string;
    };

    app.logger.info({ shiftId, type, count }, 'Creating battery record');

    try {
      const [record] = await app.db.insert(schema.batteryRecords).values({
        id: randomUUID(),
        shiftId,
        type,
        count,
        photoUrl,
        comment,
      }).returning();

      app.logger.info({ recordId: record.id }, 'Battery record created successfully');
      return record;
    } catch (error) {
      app.logger.error({ err: error, shiftId }, 'Failed to create battery record');
      throw error;
    }
  });

  // GET /api/battery-records/:shiftId - Get battery records for shift
  fastify.get("/api/battery-records/:shiftId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const { shiftId } = request.params as { shiftId: string };
    app.logger.info({ shiftId }, 'Fetching battery records');

    try {
      const records = await app.db.select().from(schema.batteryRecords)
        .where(eq(schema.batteryRecords.shiftId, shiftId));

      app.logger.info({ shiftId, count: records.length }, 'Battery records fetched');
      return records;
    } catch (error) {
      app.logger.error({ err: error, shiftId }, 'Failed to fetch battery records');
      throw error;
    }
  });
}
