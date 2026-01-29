import { pgTable, text, timestamp, uuid, boolean, integer, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Users Table
// ============================================
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  phone: text('phone').unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['driver', 'team_leader', 'admin'] }).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_phone_idx').on(table.phone),
  index('users_role_idx').on(table.role),
]);

// ============================================
// Vehicles Table
// ============================================
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  licensePlate: text('license_plate').notNull().unique(),
  qrCode: text('qr_code').notNull().unique(),
  status: text('status', { enum: ['available', 'in_use', 'maintenance'] }).notNull().default('available'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('vehicles_status_idx').on(table.status),
]);

// ============================================
// Shifts Table
// ============================================
export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: text('status', { enum: ['active', 'completed'] }).notNull().default('active'),
  startBatteryCount: integer('start_battery_count'),
  endBatteryCount: integer('end_battery_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('shifts_driver_id_idx').on(table.driverId),
  index('shifts_vehicle_id_idx').on(table.vehicleId),
  index('shifts_status_idx').on(table.status),
]);

// ============================================
// Inspections Table
// ============================================
export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  shiftId: uuid('shift_id').notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['departure', 'return'] }).notNull(),
  videoUrl: text('video_url'),
  trousseSecours: boolean('trousse_secours').notNull(),
  trousseSecoursPhoto: text('trousse_secours_photo'),
  trousseSecoursComment: text('trousse_secours_comment'),
  roueSecours: boolean('roue_secours').notNull(),
  roueSecoursPhoto: text('roue_secours_photo'),
  roueSecoursComment: text('roue_secours_comment'),
  extincteur: boolean('extincteur').notNull(),
  extincteurPhoto: text('extincteur_photo'),
  extincteurComment: text('extincteur_comment'),
  boosterBatterie: boolean('booster_batterie').notNull(),
  boosterBatteriePhoto: text('booster_batterie_photo'),
  boosterBatterieComment: text('booster_batterie_comment'),
  completedAt: timestamp('completed_at'),
}, (table) => [
  index('inspections_shift_id_idx').on(table.shiftId),
]);

// ============================================
// Battery Records Table
// ============================================
export const batteryRecords = pgTable('battery_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  shiftId: uuid('shift_id').notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['departure', 'return'] }).notNull(),
  count: integer('count').notNull(),
  photoUrl: text('photo_url').notNull(),
  comment: text('comment').notNull(),
  driverSignature: text('driver_signature'),
  teamLeaderSignature: text('team_leader_signature'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('battery_records_shift_id_idx').on(table.shiftId),
]);

// ============================================
// Location Updates Table
// ============================================
export const locationUpdates = pgTable('location_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  shiftId: uuid('shift_id').notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  latitude: decimal('latitude', { precision: 10, scale: 8, mode: 'string' }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8, mode: 'string' }).notNull(),
  accuracy: decimal('accuracy', { precision: 10, scale: 2, mode: 'string' }),
  timestamp: timestamp('timestamp').notNull(),
}, (table) => [
  index('location_updates_shift_id_idx').on(table.shiftId),
  index('location_updates_driver_id_idx').on(table.driverId),
  index('location_updates_timestamp_idx').on(table.timestamp),
]);

// ============================================
// Maintenance Logs Table
// ============================================
export const maintenanceLogs = pgTable('maintenance_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  performedBy: text('performed_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  performedAt: timestamp('performed_at').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2, mode: 'string' }),
  notes: text('notes'),
}, (table) => [
  index('maintenance_logs_vehicle_id_idx').on(table.vehicleId),
  index('maintenance_logs_performed_at_idx').on(table.performedAt),
]);

// ============================================
// Relations
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
  maintenanceLogs: many(maintenanceLogs),
  locationUpdates: many(locationUpdates),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  shifts: many(shifts),
  maintenanceLogs: many(maintenanceLogs),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  driver: one(users, {
    fields: [shifts.driverId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [shifts.vehicleId],
    references: [vehicles.id],
  }),
  inspections: many(inspections),
  batteryRecords: many(batteryRecords),
  locationUpdates: many(locationUpdates),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  shift: one(shifts, {
    fields: [inspections.shiftId],
    references: [shifts.id],
  }),
}));

export const batteryRecordsRelations = relations(batteryRecords, ({ one }) => ({
  shift: one(shifts, {
    fields: [batteryRecords.shiftId],
    references: [shifts.id],
  }),
}));

export const locationUpdatesRelations = relations(locationUpdates, ({ one }) => ({
  shift: one(shifts, {
    fields: [locationUpdates.shiftId],
    references: [shifts.id],
  }),
  driver: one(users, {
    fields: [locationUpdates.driverId],
    references: [users.id],
  }),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceLogs.vehicleId],
    references: [vehicles.id],
  }),
  performedByUser: one(users, {
    fields: [maintenanceLogs.performedBy],
    references: [users.id],
  }),
}));
