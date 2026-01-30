import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";
import { requireAuth, requireTeamLeaderOrAdmin } from "../utils/auth.js";
import QRCode from 'qrcode';

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
  const checkAuth = requireAuth(app);
  const checkTeamLeaderOrAdmin = requireTeamLeaderOrAdmin(app);

  // POST /api/vehicles - Create a new vehicle
  fastify.post("/api/vehicles", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { name, licensePlate } = request.body as { name: string; licensePlate: string };

    app.logger.info({ name, licensePlate }, 'Creating new vehicle');

    try {
      const vehicleId = randomUUID();
      const qrCodeData = generateQRCode();
      const qrCode = await QRCode.toDataURL(qrCodeData);

      const [vehicle] = await app.db.insert(schema.vehicles).values({
        id: vehicleId,
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
    const session = await checkAuth(request, reply);
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

  // GET /api/vehicles/:id - Get vehicle by ID
  fastify.get("/api/vehicles/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
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

  // PUT /api/vehicles/:id - Update vehicle
  fastify.put("/api/vehicles/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    const { name, status } = request.body as { name?: string; status?: string };

    app.logger.info({ vehicleId: id, name, status }, 'Updating vehicle');

    try {
      const updates: Record<string, any> = {};
      if (name) updates.name = name;
      if (status) updates.status = status;

      const [updatedVehicle] = await app.db.update(schema.vehicles)
        .set(updates)
        .where(eq(schema.vehicles.id, id))
        .returning();

      app.logger.info({ vehicleId: updatedVehicle.id }, 'Vehicle updated successfully');
      return updatedVehicle;
    } catch (error) {
      app.logger.error({ err: error, vehicleId: id }, 'Failed to update vehicle');
      throw error;
    }
  });

  // DELETE /api/vehicles/:id - Delete vehicle
  fastify.delete("/api/vehicles/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await checkAuth(request, reply);
    if (!session) return;

    const sessionCheck = await checkTeamLeaderOrAdmin(request, reply, session);
    if (!sessionCheck) return;

    const { id } = request.params as { id: string };
    app.logger.info({ vehicleId: id }, 'Deleting vehicle');

    try {
      await app.db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
      app.logger.info({ vehicleId: id }, 'Vehicle deleted successfully');
      return { success: true };
    } catch (error) {
      app.logger.error({ err: error, vehicleId: id }, 'Failed to delete vehicle');
      throw error;
    }
  });
}
