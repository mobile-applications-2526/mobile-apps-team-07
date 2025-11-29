/**
 * Database Service
 * 
 * Handles database initialization and seeding.
 */

import * as db from '@/lib/database';
import { SeedVesselData } from '@/lib/database';
import DUMMY_BOATS from '@/data/dummy_boat_data.json';

// Schema version - increment when making breaking changes
const SCHEMA_VERSION = 2;

/**
 * Initialize the database and seed with initial data if needed
 */
export async function initializeDatabase(): Promise<void> {
  await db.getDatabase();
  
  // Check if we need to reset for schema changes (dev only)
  const needsReset = await checkSchemaVersion();
  if (needsReset) {
    console.log('Schema version changed, resetting database...');
    await db.resetDatabase();
  }
  
  await db.seedInitialData(DUMMY_BOATS as SeedVesselData[]);
}

/**
 * Check if schema version has changed (simple check for new columns)
 */
async function checkSchemaVersion(): Promise<boolean> {
  try {
    const database = await db.getDatabase();
    // Try to select a new column - if it fails, we need to reset
    await database.getFirstAsync('SELECT flag FROM vessels LIMIT 1');
    return false; // Column exists, no reset needed
  } catch {
    return true; // Column doesn't exist, need to reset
  }
}

/**
 * Reset the database (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  await db.resetDatabase();
}

/**
 * Force reseed the database with fresh data
 */
export async function forceReseed(): Promise<void> {
  await db.resetDatabase();
  await db.seedInitialData(DUMMY_BOATS as SeedVesselData[]);
}