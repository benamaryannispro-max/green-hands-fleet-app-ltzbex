import { createApplication } from "@specific-dev/framework";
import { eq } from "drizzle-orm";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import * as usersRoutes from './routes/users.js';
import * as shiftsRoutes from './routes/shifts.js';
import * as inspectionsRoutes from './routes/inspections.js';
import * as batteryRecordsRoutes from './routes/battery-records.js';
import * as locationRoutes from './routes/location.js';
import * as vehiclesRoutes from './routes/vehicles.js';
import * as maintenanceRoutes from './routes/maintenance.js';
import * as uploadsRoutes from './routes/uploads.js';

// Merge schemas for full database type support
const schema = { ...appSchema, ...authSchema };

// Create application with merged schema
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with Better Auth
app.withAuth();

// Enable file storage for uploads
app.withStorage();

// Create default team leader if it doesn't exist
const existingTeamLeader = await app.db.select().from(appSchema.users)
  .where(eq(appSchema.users.email, 'contact@thegreenhands.fr'))
  .limit(1);

if (existingTeamLeader.length === 0) {
  app.logger.info('Creating default team leader');
  try {
    await app.db.insert(appSchema.users).values({
      email: 'contact@thegreenhands.fr',
      firstName: 'Green',
      lastName: 'Hands',
      role: 'team_leader',
      isApproved: true,
      isActive: true,
    });
    app.logger.info('Default team leader created');
  } catch (error) {
    app.logger.warn({ err: error }, 'Could not create default team leader');
  }
}

// Register all route modules
usersRoutes.register(app, app.fastify);
shiftsRoutes.register(app, app.fastify);
inspectionsRoutes.register(app, app.fastify);
batteryRecordsRoutes.register(app, app.fastify);
locationRoutes.register(app, app.fastify);
vehiclesRoutes.register(app, app.fastify);
maintenanceRoutes.register(app, app.fastify);
uploadsRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Fleet management system running');
