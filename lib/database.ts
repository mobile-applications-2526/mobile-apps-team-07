import * as SQLite from 'expo-sqlite';
import { Vessel, CreateVesselInput, UpdateVesselInput } from '@/types';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Get or create database instance
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('safarban.db');
    await initializeDatabase();
  }
  return db;
}

// Initialize database tables
async function initializeDatabase(): Promise<void> {
  if (!db) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS vessels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      imo TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      subtype TEXT NOT NULL,
      eta TEXT,
      port TEXT,
      image TEXT,
      hasQ88 INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vessels_imo ON vessels(imo);
    CREATE INDEX IF NOT EXISTS idx_vessels_type ON vessels(type);
  `);
}

// ============================================
// VESSEL CRUD OPERATIONS
// ============================================

/**
 * Get all vessels ordered by creation date (newest first)
 */
export async function getAllVessels(): Promise<Vessel[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    imo: string;
    type: string;
    subtype: string;
    eta: string | null;
    port: string | null;
    image: string | null;
    hasQ88: number;
    createdAt: string;
    updatedAt: string;
  }>('SELECT * FROM vessels ORDER BY createdAt DESC');

  return rows.map(row => ({
    ...row,
    hasQ88: row.hasQ88 === 1,
  }));
}

/**
 * Get a single vessel by ID
 */
export async function getVesselById(id: number): Promise<Vessel | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    id: number;
    name: string;
    imo: string;
    type: string;
    subtype: string;
    eta: string | null;
    port: string | null;
    image: string | null;
    hasQ88: number;
    createdAt: string;
    updatedAt: string;
  }>('SELECT * FROM vessels WHERE id = ?', [id]);

  if (!row) return null;

  return {
    ...row,
    hasQ88: row.hasQ88 === 1,
  };
}

/**
 * Get a single vessel by IMO number
 */
export async function getVesselByImo(imo: string): Promise<Vessel | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    id: number;
    name: string;
    imo: string;
    type: string;
    subtype: string;
    eta: string | null;
    port: string | null;
    image: string | null;
    hasQ88: number;
    createdAt: string;
    updatedAt: string;
  }>('SELECT * FROM vessels WHERE imo = ?', [imo]);

  if (!row) return null;

  return {
    ...row,
    hasQ88: row.hasQ88 === 1,
  };
}

/**
 * Check if an IMO number already exists
 */
export async function imoExists(imo: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM vessels WHERE imo = ?',
    [imo]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Get all existing IMO numbers
 */
export async function getAllImos(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ imo: string }>('SELECT imo FROM vessels');
  return rows.map(row => row.imo);
}

/**
 * Create a new vessel
 */
export async function createVessel(input: CreateVesselInput): Promise<Vessel> {
  const database = await getDatabase();
  const now = new Date().toISOString();

  const result = await database.runAsync(
    `INSERT INTO vessels (name, imo, type, subtype, eta, port, image, hasQ88, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.imo,
      input.type,
      input.subtype,
      input.eta ?? null,
      input.port ?? null,
      input.image ?? null,
      input.hasQ88 ? 1 : 0,
      now,
      now,
    ]
  );

  const vessel = await getVesselById(result.lastInsertRowId);
  if (!vessel) {
    throw new Error('Failed to create vessel');
  }

  return vessel;
}

/**
 * Update an existing vessel
 */
export async function updateVessel(id: number, input: UpdateVesselInput): Promise<Vessel | null> {
  const database = await getDatabase();
  const now = new Date().toISOString();

  // Build dynamic update query
  const updates: string[] = ['updatedAt = ?'];
  const values: (string | number | null)[] = [now];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.imo !== undefined) {
    updates.push('imo = ?');
    values.push(input.imo);
  }
  if (input.type !== undefined) {
    updates.push('type = ?');
    values.push(input.type);
  }
  if (input.subtype !== undefined) {
    updates.push('subtype = ?');
    values.push(input.subtype);
  }
  if (input.eta !== undefined) {
    updates.push('eta = ?');
    values.push(input.eta);
  }
  if (input.port !== undefined) {
    updates.push('port = ?');
    values.push(input.port);
  }
  if (input.image !== undefined) {
    updates.push('image = ?');
    values.push(input.image);
  }
  if (input.hasQ88 !== undefined) {
    updates.push('hasQ88 = ?');
    values.push(input.hasQ88 ? 1 : 0);
  }

  values.push(id);

  await database.runAsync(
    `UPDATE vessels SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return getVesselById(id);
}

/**
 * Delete a vessel by ID
 */
export async function deleteVessel(id: number): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.runAsync('DELETE FROM vessels WHERE id = ?', [id]);
  return result.changes > 0;
}

/**
 * Get vessels count
 */
export async function getVesselsCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM vessels'
  );
  return result?.count ?? 0;
}

/**
 * Search vessels by name or IMO
 */
export async function searchVessels(query: string): Promise<Vessel[]> {
  const database = await getDatabase();
  const searchTerm = `%${query}%`;
  
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    imo: string;
    type: string;
    subtype: string;
    eta: string | null;
    port: string | null;
    image: string | null;
    hasQ88: number;
    createdAt: string;
    updatedAt: string;
  }>(
    'SELECT * FROM vessels WHERE name LIKE ? OR imo LIKE ? ORDER BY createdAt DESC',
    [searchTerm, searchTerm]
  );

  return rows.map(row => ({
    ...row,
    hasQ88: row.hasQ88 === 1,
  }));
}

/**
 * Get vessels by type
 */
export async function getVesselsByType(type: string): Promise<Vessel[]> {
  const database = await getDatabase();
  
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    imo: string;
    type: string;
    subtype: string;
    eta: string | null;
    port: string | null;
    image: string | null;
    hasQ88: number;
    createdAt: string;
    updatedAt: string;
  }>('SELECT * FROM vessels WHERE type = ? ORDER BY createdAt DESC', [type]);

  return rows.map(row => ({
    ...row,
    hasQ88: row.hasQ88 === 1,
  }));
}

// ============================================
// SEED DATA (for initial setup)
// ============================================

/**
 * Seed initial data from dummy JSON
 */
export async function seedInitialData(dummyData: Array<{
  id: string;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta?: string;
  port?: string;
  image?: string;
  hasQ88?: boolean;
}>): Promise<void> {
  const database = await getDatabase();
  
  // Check if we already have data
  const count = await getVesselsCount();
  if (count > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }

  console.log('Seeding initial vessel data...');
  
  for (const item of dummyData) {
    try {
      await createVessel({
        name: item.name,
        imo: item.imo,
        type: item.type,
        subtype: item.subtype,
        eta: item.eta ?? null,
        port: item.port ?? null,
        image: item.image ?? null,
        hasQ88: item.hasQ88 ?? false,
      });
    } catch (error) {
      console.error(`Failed to seed vessel ${item.name}:`, error);
    }
  }

  console.log('Seeding complete!');
}

/**
 * Reset database (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM vessels');
  console.log('Database reset complete');
}
