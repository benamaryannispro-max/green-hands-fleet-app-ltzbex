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
import * as authLoggingRoutes from './routes/auth-logging.js';

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
app.logger.info('Checking for default team leader test user (contact@thegreenhands.fr)');
const existingAuthUser = await app.db.select().from(authSchema.user)
  .where(eq(authSchema.user.email, 'contact@thegreenhands.fr'))
  .limit(1);

if (existingAuthUser.length === 0) {
  app.logger.info('Test user not found in database. Creating default team leader test user...');
  try {
    const userId = randomUUID();
    const accountId = randomUUID();

    app.logger.info(
      { userId, accountId, email: 'contact@thegreenhands.fr' },
      'Generated UUIDs for test user'
    );

    // Import bcrypt for password hashing
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Lagrandeteam13', 10);
    app.logger.info('Password hashed successfully');

    // Create user in Better Auth (auth table) - FIRST
    app.logger.info('Step 1: Creating user in auth schema');
    const [newAuthUser] = await app.db.insert(authSchema.user).values({
      id: userId,
      email: 'contact@thegreenhands.fr',
      name: 'Admin Test',
      emailVerified: true,
    }).returning();
    app.logger.info({ userId: newAuthUser.id, email: newAuthUser.email }, 'User created in auth schema successfully');

    // Create account entry with password hash - SECOND (needs userId from user table)
    app.logger.info('Step 2: Creating account entry with password');
    const [newAccount] = await app.db.insert(authSchema.account).values({
      id: accountId,
      userId: userId,
      accountId: 'credential_' + userId,
      providerId: 'credential',
      password: hashedPassword,
    }).returning();
    app.logger.info(
      { accountId: newAccount.id, userId: newAccount.userId, providerId: newAccount.providerId },
      'Account entry created with hashed password'
    );

    // Create corresponding entry in custom users table - THIRD
    app.logger.info('Step 3: Creating user in app schema with team_leader role');
    const [newAppUser] = await app.db.insert(appSchema.users).values({
      id: userId,
      email: 'contact@thegreenhands.fr',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'team_leader',
      isApproved: true,
      isActive: true,
    }).returning();
    app.logger.info({ userId: newAppUser.id, role: newAppUser.role }, 'User created in app schema successfully');

    app.logger.info(
      {
        userId,
        email: 'contact@thegreenhands.fr',
        name: 'Admin Test',
        role: 'team_leader',
        isApproved: true,
        isActive: true,
        emailVerified: true,
      },
      '✓ DEFAULT TEST USER CREATED SUCCESSFULLY - Email: contact@thegreenhands.fr, Password: Lagrandeteam13'
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
      userId: existingAuthUser[0].id,
      email: existingAuthUser[0].email,
      emailVerified: existingAuthUser[0].emailVerified,
    },
    '✓ DEFAULT TEST USER ALREADY EXISTS - Email: contact@thegreenhands.fr'
  );
}

// Register authentication logging first (hooks need to be registered early)
authLoggingRoutes.register(app, app.fastify);

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
