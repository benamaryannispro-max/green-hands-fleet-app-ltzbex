import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

// Helper function to generate unique QR code
function generateQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

  // POST /api/vehicles - Create a new vehicle
  fastify.post("/api/vehicles", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { name, licensePlate, qrCode } = request.body as { name: string; licensePlate: string; qrCode: string };

    app.logger.info({ name, licensePlate }, 'Creating new vehicle');

    try {
      const [vehicle] = await app.db.insert(schema.vehicles).values({
        name,
        licensePlate,
        qrCode,
        status: 'available',
      }).returning();

      app.logger.info({ vehicleId: vehicle.id, name }, 'Vehicle created successfully');
      return vehicle;
    } catch (error) {
      app.logger.error({ err: error, name, licensePlate }, 'Failed to create vehicle');
      throw error;
    }
  });

  // GET /api/vehicles - Get all vehicles
  fastify.get("/api/vehicles", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({}, 'Fetching vehicles');

    try {
      const vehicles = await app.db.select().from(schema.vehicles);
      app.logger.info({ count: vehicles.length }, 'Vehicles fetched');
      return vehicles;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch vehicles');
      throw error;
    }
  });

  // GET /api/vehicles/:id - Get a specific vehicle
  fastify.get("/api/vehicles/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    app.logger.info({ vehicleId: id }, 'Fetching vehicle');

    try {
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, id))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId: id }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      app.logger.info({ vehicleId: id }, 'Vehicle fetched');
      return vehicle[0];
    } catch (error) {
      app.logger.error({ err: error, vehicleId: id }, 'Failed to fetch vehicle');
      throw error;
    }
  });

  // PUT /api/vehicles/:id - Update a vehicle
  fastify.put("/api/vehicles/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const { name, licensePlate, status } = request.body as { name?: string; licensePlate?: string; status?: string };

    app.logger.info({ vehicleId: id, name, licensePlate, status }, 'Updating vehicle');

    try {
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, id))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId: id }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      const updateData: Record<string, any> = {};
      if (name) updateData.name = name;
      if (licensePlate) updateData.licensePlate = licensePlate;
      if (status) updateData.status = status;

      const [updated] = await app.db.update(schema.vehicles)
        .set(updateData)
        .where(eq(schema.vehicles.id, id))
        .returning();

      app.logger.info({ vehicleId: id }, 'Vehicle updated successfully');
      return updated;
    } catch (error) {
      app.logger.error({ err: error, vehicleId: id }, 'Failed to update vehicle');
      throw error;
    }
  });

  // POST /api/vehicles/:id/generate-qr - Generate QR code for vehicle
  fastify.post("/api/vehicles/:id/generate-qr", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireTeamLeaderOrAdmin(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    app.logger.info({ vehicleId: id }, 'Generating QR code');

    try {
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.id, id))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ vehicleId: id }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      // Generate unique QR code
      let qrCode = generateQRCode();
      let existingQRCode = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.qrCode, qrCode))
        .limit(1);

      // Keep generating until we get a unique one
      while (existingQRCode.length > 0) {
        qrCode = generateQRCode();
        existingQRCode = await app.db.select().from(schema.vehicles)
          .where(eq(schema.vehicles.qrCode, qrCode))
          .limit(1);
      }

      // Generate QR code image as data URL
      const qrImageUrl = await QRCode.toDataURL(qrCode);

      // Update vehicle with QR code
      const [updated] = await app.db.update(schema.vehicles)
        .set({ qrCode })
        .where(eq(schema.vehicles.id, id))
        .returning();

      app.logger.info({ vehicleId: id, qrCode }, 'QR code generated successfully');
      return { qrCode, qrImageUrl, vehicle: updated };
    } catch (error) {
      app.logger.error({ err: error, vehicleId: id }, 'Failed to generate QR code');
      throw error;
    }
  });

  // GET /api/vehicles/qr/:qrCode - Get vehicle by QR code with inspection and safety status
  fastify.get("/api/vehicles/qr/:qrCode", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { qrCode } = request.params as { qrCode: string };
    app.logger.info({ qrCode }, 'Fetching vehicle by QR code');

    try {
      const vehicle = await app.db.select().from(schema.vehicles)
        .where(eq(schema.vehicles.qrCode, qrCode))
        .limit(1);

      if (vehicle.length === 0) {
        app.logger.warn({ qrCode }, 'Vehicle not found');
        return reply.status(404).send({ error: 'Vehicle not found' });
      }

      // Get latest inspection
      const latestInspection = await app.db.select().from(schema.inspections)
        .where(eq(schema.inspections.shiftId, 'placeholder')) // Will be overridden below
        .limit(1);

      // Get safety status based on latest inspection
      let safetyStatus = 'ok';
      if (latestInspection.length > 0) {
        const inspection = latestInspection[0];
        if (!inspection.trousseSecours || !inspection.roueSecours || !inspection.extincteur || !inspection.boosterBatterie) {
          safetyStatus = 'issues';
        }
      }

      app.logger.info({ vehicleId: vehicle[0].id }, 'Vehicle fetched by QR code');
      return {
        vehicle: vehicle[0],
        latestInspection: latestInspection.length > 0 ? latestInspection[0] : null,
        safetyStatus
      };
    } catch (error) {
      app.logger.error({ err: error, qrCode }, 'Failed to fetch vehicle by QR code');
      throw error;
    }
  });
}
