/**
 * Database Service
 * 
 * Handles database initialization and seeding.
 */

import * as db from '@/lib/database';
import DUMMY_BOATS from '@/data/dummy_boat_data.json';

/**
 * Initialize the database and seed with initial data if needed
 */
export async function initializeDatabase(): Promise<void> {
  await db.getDatabase();
  await db.seedInitialData(DUMMY_BOATS as any);
}

/**
 * Reset the database (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  await db.resetDatabase();
}