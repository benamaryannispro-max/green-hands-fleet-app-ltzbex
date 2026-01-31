import { createApplication } from "@specific-dev/framework";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as appSchema from './db/schema.js';

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
import * as authRoutes from './routes/auth.js';

// Create application with app schema only
export const app = await createApplication(appSchema);

// Export App type for use in route files
export type App = typeof app;

// Enable file storage for uploads
app.withStorage();

// Create default team leader test user if it doesn't exist
app.logger.info('Checking for default team leader test user (contact@thegreenhands.fr)');
const existingUser = await app.db.select().from(appSchema.users)
  .where(eq(appSchema.users.email, 'contact@thegreenhands.fr'))
  .limit(1);

if (existingUser.length === 0) {
  app.logger.info('Test user not found in database. Creating default team leader test user...');
  try {
    const userId = randomUUID();

    app.logger.info(
      { userId, email: 'contact@thegreenhands.fr' },
      'Generated UUID for test user'
    );

    // Import bcrypt for password hashing
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Lagrandeteam13', 10);
    app.logger.info('Password hashed successfully');

    // Create user in app schema
    app.logger.info('Creating user in database');
    const [newUser] = await app.db.insert(appSchema.users).values({
      id: userId,
      email: 'contact@thegreenhands.fr',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'team_leader',
      isApproved: true,
      isActive: true,
      password: hashedPassword,
    }).returning();

    app.logger.info({ userId: newUser.id, email: newUser.email }, 'User created successfully');
    app.logger.info(
      {
        userId,
        email: 'contact@thegreenhands.fr',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'team_leader',
      },
      '✅ Utilisateur test créé: contact@thegreenhands.fr'
    );
  } catch (error) {
    app.logger.error(
      {
        err: error,
        message: error instanceof Error ? error.message : String(error),
        email: 'contact@thegreenhands.fr'
      },
      'CRITICAL: Failed to create default team leader test user'
    );
  }
} else {
  app.logger.info(
    {
      userId: existingUser[0].id,
      email: existingUser[0].email,
    },
    '✅ Utilisateur test déjà existant: contact@thegreenhands.fr'
  );

  // FORCE password update for existing test user
  app.logger.info('Resetting password for existing test user...');
  try {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Lagrandeteam13', 10);

    await app.db.update(appSchema.users)
      .set({ password: hashedPassword })
      .where(eq(appSchema.users.id, existingUser[0].id));

    app.logger.info(
      {
        userId: existingUser[0].id,
        email: 'contact@thegreenhands.fr',
      },
      '✅ Mot de passe de l\'utilisateur test réinitialisé'
    );
  } catch (error) {
    app.logger.error(
      {
        err: error,
        message: error instanceof Error ? error.message : String(error),
        userId: existingUser[0].id,
      },
      'CRITICAL: Failed to reset test user password'
    );
  }
}

// Register all route modules
authRoutes.register(app, app.fastify);
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
