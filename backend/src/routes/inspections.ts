import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireDriver } from "../utils/auth.js";

export function register(app: App, fastify: FastifyInstance) {
  const checkAuth = requireAuth(app);
  const checkDriver = requireDriver(app);

  // POST /api/inspections - Create a new inspection
  fastify.post("/api/inspections", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkDriver(request, reply, session);
    if (!sessionCheck) return;

    const body = request.body as {
      shiftId: string;
      type: 'departure' | 'return';
      videoUrl?: string;
      trousseSecours: boolean;
      trousseSecoursPhoto?: string;
      trousseSecoursComment?: string;
      roueSecours: boolean;
      roueSecoursPhoto?: string;
      roueSecoursComment?: string;
      extincteur: boolean;
      extincteurPhoto?: string;
      extincteurComment?: string;
      boosterBatterie: boolean;
      boosterBatteriePhoto?: string;
      boosterBatterieComment?: string;
    };

    app.logger.info({ shiftId: body.shiftId, type: body.type }, 'Creating inspection');

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
        return reply.status(403).send({ error: 'Forbidden: you can only inspect your own shifts' });
      }

      // Validate inspection requirements
      const validateItem = (present: boolean, photo?: string, comment?: string): boolean => {
        if (present) {
          return !!photo;
        } else {
          return !!comment;
        }
      };

      const trousseValid = validateItem(body.trousseSecours, body.trousseSecoursPhoto, body.trousseSecoursComment);
      const roueValid = validateItem(body.roueSecours, body.roueSecoursPhoto, body.roueSecoursComment);
      const extincteurValid = validateItem(body.extincteur, body.extincteurPhoto, body.extincteurComment);
      const boosterValid = validateItem(body.boosterBatterie, body.boosterBatteriePhoto, body.boosterBatterieComment);

      if (!trousseValid || !roueValid || !extincteurValid || !boosterValid) {
        app.logger.warn({ shiftId: body.shiftId }, 'Invalid inspection data: missing required photos or comments');
        return reply.status(400).send({ error: 'Invalid inspection data: each present item requires photo, each absent item requires comment' });
      }

      // Check if all items are present
      const allItemsPresent = body.trousseSecours && body.roueSecours && body.extincteur && body.boosterBatterie;

      const [inspection] = await app.db.insert(schema.inspections).values({
        id: randomUUID(),
        shiftId: body.shiftId,
        type: body.type,
        videoUrl: body.videoUrl || null,
        trousseSecours: body.trousseSecours,
        trousseSecoursPhoto: body.trousseSecoursPhoto || null,
        trousseSecoursComment: body.trousseSecoursComment || null,
        roueSecours: body.roueSecours,
        roueSecoursPhoto: body.roueSecoursPhoto || null,
        roueSecoursComment: body.roueSecoursComment || null,
        extincteur: body.extincteur,
        extincteurPhoto: body.extincteurPhoto || null,
        extincteurComment: body.extincteurComment || null,
        boosterBatterie: body.boosterBatterie,
        boosterBatteriePhoto: body.boosterBatteriePhoto || null,
        boosterBatterieComment: body.boosterBatterieComment || null,
        completedAt: new Date(),
      }).returning();

      // Generate alert if inspection failed
      if (!allItemsPresent) {
        await app.db.insert(schema.alerts).values({
          id: randomUUID(),
          type: 'inspection_failed',
          title: `Inspection ${body.type} échouée`,
          message: `L'inspection ${body.type} du véhicule a échoué. Des éléments de sécurité manquent.`,
          payload: { shiftId: body.shiftId, inspectionId: inspection.id, type: body.type },
        });
      }

      app.logger.info({ inspectionId: inspection.id, shiftId: body.shiftId }, 'Inspection created successfully');
      return inspection;
    } catch (error) {
      app.logger.error({ err: error, shiftId: body.shiftId }, 'Failed to create inspection');
      throw error;
    }
  });

  // GET /api/inspections/:shiftId - Get inspections for a shift
  fastify.get("/api/inspections/:shiftId", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const { shiftId } = request.params as { shiftId: string };
    app.logger.info({ shiftId }, 'Fetching inspections');

    try {
      const inspections = await app.db.select().from(schema.inspections)
        .where(eq(schema.inspections.shiftId, shiftId));

      app.logger.info({ shiftId, count: inspections.length }, 'Inspections fetched');
      return inspections;
    } catch (error) {
      app.logger.error({ err: error, shiftId }, 'Failed to fetch inspections');
      throw error;
    }
  });
}
