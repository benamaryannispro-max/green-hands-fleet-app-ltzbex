import { createApplication } from "@specific-dev/framework";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import * as usersRoutes from './routes/users.js';
import * as shiftsRoutes from './routes/shifts.js';
import * as inspectionsRoutes from './routes/inspections.js';
import * as batteryRecordsRoutes from './routes/battery-records.js';
import * as locationRoutes from './routes/location.js';
import * as vehiclesRoutes from './routes/vehicles.js';
import * as uploadsRoutes from './routes/uploads.js';
import * as alertsRoutes from './routes/alerts.js';
import * as maintenanceManagementRoutes from './routes/maintenance-management.js';
import * as reportsRoutes from './routes/reports.js';

// Merge schemas for full database type support
const schema = { ...appSchema, ...authSchema };

// Create application with merged schema
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication with Better Auth
// Better Auth automatically handles cookie configuration
app.withAuth();

// Enable file storage for uploads
app.withStorage();

// Create default team leader if it doesn't exist
const existingAuthUser = await app.db.select().from(authSchema.user)
  .where(eq(authSchema.user.email, 'contact@thegreenhands.fr'))
  .limit(1);

if (existingAuthUser.length === 0) {
  app.logger.info('Creating default team leader test user');
  try {
    const userId = randomUUID();
    const accountId = randomUUID();

    // Create user in Better Auth (auth table)
    await app.db.insert(authSchema.user).values({
      id: userId,
      email: 'contact@thegreenhands.fr',
      name: 'Admin Test',
      emailVerified: true,
    });

    // Create corresponding entry in custom users table
    await app.db.insert(appSchema.users).values({
      id: userId,
      email: 'contact@thegreenhands.fr',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'team_leader',
      isApproved: true,
      isActive: true,
    });

    // Create account entry with password hash
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Lagrandeteam13', 10);

    await app.db.insert(authSchema.account).values({
      id: accountId,
      userId: userId,
      accountId: userId,
      providerId: 'credential',
      password: hashedPassword,
    });

    app.logger.info({ userId }, 'Default team leader test user created successfully');
  } catch (error) {
    app.logger.warn({ err: error }, 'Could not create default team leader test user');
  }
} else {
  app.logger.info('Default team leader test user already exists');
}

// Register all route modules
usersRoutes.register(app, app.fastify);
shiftsRoutes.register(app, app.fastify);
inspectionsRoutes.register(app, app.fastify);
batteryRecordsRoutes.register(app, app.fastify);
locationRoutes.register(app, app.fastify);
vehiclesRoutes.register(app, app.fastify);
uploadsRoutes.register(app, app.fastify);
alertsRoutes.register(app, app.fastify);
maintenanceManagementRoutes.register(app, app.fastify);
reportsRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Fleet management system running');
