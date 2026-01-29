import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, gte, lte } from "drizzle-orm";
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

  // GET /api/reports/failed-inspections - Get failed inspection report
  fastify.get("/api/reports/failed-inspections", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { startDate, endDate, driverId } = request.query as {
      startDate?: string;
      endDate?: string;
      driverId?: string;
    };

    app.logger.info({ startDate, endDate, driverId }, 'Fetching failed inspections report');

    try {
      const conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(schema.inspections.completedAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(schema.inspections.completedAt, new Date(endDate)));
      }

      const inspections = await app.db.select().from(schema.inspections)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Filter for failed inspections (missing items)
      const failedInspections = inspections.filter(i =>
        !i.trousseSecours || !i.roueSecours || !i.extincteur || !i.boosterBatterie
      );

      // Get shift details for each failed inspection
      const reports = await Promise.all(
        failedInspections.map(async (inspection) => {
          const shift = await app.db.select().from(schema.shifts)
            .where(eq(schema.shifts.id, inspection.shiftId))
            .limit(1);

          if (shift.length === 0) return null;

          // Filter by driverId if provided
          if (driverId && shift[0].driverId !== driverId) return null;

          const driver = await app.db.select().from(schema.users)
            .where(eq(schema.users.id, shift[0].driverId))
            .limit(1);

          const failedItems = [];
          if (!inspection.trousseSecours) {
            failedItems.push({
              itemName: 'Trousse de secours',
              comment: inspection.trousseSecoursComment,
              photoUrl: inspection.trousseSecoursPhoto,
            });
          }
          if (!inspection.roueSecours) {
            failedItems.push({
              itemName: 'Roue de secours',
              comment: inspection.roueSecoursComment,
              photoUrl: inspection.roueSecoursPhoto,
            });
          }
          if (!inspection.extincteur) {
            failedItems.push({
              itemName: 'Extincteur',
              comment: inspection.extincteurComment,
              photoUrl: inspection.extincteurPhoto,
            });
          }
          if (!inspection.boosterBatterie) {
            failedItems.push({
              itemName: 'Booster batterie',
              comment: inspection.boosterBatterieComment,
              photoUrl: inspection.boosterBatteriePhoto,
            });
          }

          return {
            inspectionId: inspection.id,
            shiftId: shift[0].id,
            driverId: shift[0].driverId,
            driverName: driver.length > 0 ? `${driver[0].firstName} ${driver[0].lastName}` : 'Unknown',
            type: inspection.type,
            createdAt: inspection.completedAt,
            failedItems,
            videoUrl: inspection.videoUrl,
          };
        })
      );

      const filteredReports = reports.filter(Boolean);
      app.logger.info({ count: filteredReports.length }, 'Failed inspections report fetched');
      return filteredReports;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch failed inspections report');
      throw error;
    }
  });

  // GET /api/reports/failed-inspections/export - Export failed inspections as JSON
  fastify.get("/api/reports/failed-inspections/export", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { startDate, endDate, driverId } = request.query as {
      startDate?: string;
      endDate?: string;
      driverId?: string;
    };

    app.logger.info({ startDate, endDate, driverId }, 'Exporting failed inspections');

    try {
      const conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(schema.inspections.completedAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(schema.inspections.completedAt, new Date(endDate)));
      }

      const inspections = await app.db.select().from(schema.inspections)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Filter for failed inspections (missing items)
      const failedInspections = inspections.filter(i =>
        !i.trousseSecours || !i.roueSecours || !i.extincteur || !i.boosterBatterie
      );

      // Get shift details for each failed inspection
      const reports = await Promise.all(
        failedInspections.map(async (inspection) => {
          const shift = await app.db.select().from(schema.shifts)
            .where(eq(schema.shifts.id, inspection.shiftId))
            .limit(1);

          if (shift.length === 0) return null;

          // Filter by driverId if provided
          if (driverId && shift[0].driverId !== driverId) return null;

          const driver = await app.db.select().from(schema.users)
            .where(eq(schema.users.id, shift[0].driverId))
            .limit(1);

          const failedItems = [];
          if (!inspection.trousseSecours) {
            failedItems.push({
              itemName: 'Trousse de secours',
              comment: inspection.trousseSecoursComment,
              photoUrl: inspection.trousseSecoursPhoto,
            });
          }
          if (!inspection.roueSecours) {
            failedItems.push({
              itemName: 'Roue de secours',
              comment: inspection.roueSecoursComment,
              photoUrl: inspection.roueSecoursPhoto,
            });
          }
          if (!inspection.extincteur) {
            failedItems.push({
              itemName: 'Extincteur',
              comment: inspection.extincteurComment,
              photoUrl: inspection.extincteurPhoto,
            });
          }
          if (!inspection.boosterBatterie) {
            failedItems.push({
              itemName: 'Booster batterie',
              comment: inspection.boosterBatterieComment,
              photoUrl: inspection.boosterBatteriePhoto,
            });
          }

          return {
            inspectionId: inspection.id,
            shiftId: shift[0].id,
            driverId: shift[0].driverId,
            driverName: driver.length > 0 ? `${driver[0].firstName} ${driver[0].lastName}` : 'Unknown',
            type: inspection.type,
            createdAt: inspection.completedAt,
            failedItems,
            videoUrl: inspection.videoUrl,
          };
        })
      );

      const filteredReports = reports.filter(Boolean);

      app.logger.info({ count: filteredReports.length }, 'Failed inspections exported');
      return {
        data: filteredReports,
        exportedAt: new Date(),
        totalRecords: filteredReports.length,
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to export failed inspections');
      throw error;
    }
  });
}
