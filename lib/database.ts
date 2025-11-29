import * as SQLite from 'expo-sqlite';
import { Vessel, CreateVesselInput, UpdateVesselInput } from '@/types';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Database version for migrations
const DB_VERSION = 2;

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
      flag TEXT,
      classification TEXT,
      buildYear INTEGER,
      drydockDue TEXT,
      dwt REAL,
      summerDraft REAL,
      cubicCapacity REAL,
      cargoTanks INTEGER,
      tankCoating TEXT,
      maxCargoTemp REAL,
      minCargoTemp REAL,
      maxPressure REAL,
      avgSpeed REAL,
      fuelConsumption REAL,
      eta TEXT,
      port TEXT,
      image TEXT,
      hasQ88 INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vessels_imo ON vessels(imo);
    CREATE INDEX IF NOT EXISTS idx_vessels_type ON vessels(type);
    
    -- Noon reports table for KPI tracking
    CREATE TABLE IF NOT EXISTS noon_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vesselId INTEGER NOT NULL,
      reportDate TEXT NOT NULL,
      currentSpeed REAL,
      fuelConsumed REAL,
      cargoTemp REAL,
      lat REAL,
      lng REAL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vesselId) REFERENCES vessels(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_noon_reports_vessel ON noon_reports(vesselId);
    
    -- Charter party table
    CREATE TABLE IF NOT EXISTS charter_parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vesselId INTEGER NOT NULL,
      voyageId INTEGER,
      warrantySpeed REAL,
      fuelAllowance REAL,
      startDate TEXT,
      endDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vesselId) REFERENCES vessels(id) ON DELETE CASCADE
    );
    
    -- Voyages table
    CREATE TABLE IF NOT EXISTS voyages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vesselId INTEGER NOT NULL,
      voyageNumber TEXT,
      origin TEXT,
      destination TEXT,
      cargoType TEXT,
      requiredMinTemp REAL,
      departureDate TEXT,
      arrivalDate TEXT,
      status TEXT DEFAULT 'planned',
      charterPartyId INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vesselId) REFERENCES vessels(id) ON DELETE CASCADE,
      FOREIGN KEY (charterPartyId) REFERENCES charter_parties(id) ON DELETE SET NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_voyages_vessel ON voyages(vesselId);
  `);
}

// ============================================
// VESSEL CRUD OPERATIONS
// ============================================

// Type for database row (hasQ88 is stored as number)
interface VesselRow {
  id: number;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  flag: string | null;
  classification: string | null;
  buildYear: number | null;
  drydockDue: string | null;
  dwt: number | null;
  summerDraft: number | null;
  cubicCapacity: number | null;
  cargoTanks: number | null;
  tankCoating: string | null;
  maxCargoTemp: number | null;
  minCargoTemp: number | null;
  maxPressure: number | null;
  avgSpeed: number | null;
  fuelConsumption: number | null;
  eta: string | null;
  port: string | null;
  image: string | null;
  hasQ88: number;
  createdAt: string;
  updatedAt: string;
}

// Convert database row to Vessel type
function rowToVessel(row: VesselRow): Vessel {
  return {
    ...row,
    hasQ88: row.hasQ88 === 1,
  };
}

/**
 * Get all vessels ordered by creation date (newest first)
 */
export async function getAllVessels(): Promise<Vessel[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<VesselRow>('SELECT * FROM vessels ORDER BY createdAt DESC');
  return rows.map(rowToVessel);
}

/**
 * Get a single vessel by ID
 */
export async function getVesselById(id: number): Promise<Vessel | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<VesselRow>('SELECT * FROM vessels WHERE id = ?', [id]);
  if (!row) return null;
  return rowToVessel(row);
}

/**
 * Get a single vessel by IMO number
 */
export async function getVesselByImo(imo: string): Promise<Vessel | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<VesselRow>('SELECT * FROM vessels WHERE imo = ?', [imo]);
  if (!row) return null;
  return rowToVessel(row);
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
    `INSERT INTO vessels (
      name, imo, type, subtype, flag, classification, buildYear, drydockDue,
      dwt, summerDraft, cubicCapacity, cargoTanks, tankCoating,
      maxCargoTemp, minCargoTemp, maxPressure, avgSpeed, fuelConsumption,
      eta, port, image, hasQ88, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.imo,
      input.type,
      input.subtype,
      input.flag ?? null,
      input.classification ?? null,
      input.buildYear ?? null,
      input.drydockDue ?? null,
      input.dwt ?? null,
      input.summerDraft ?? null,
      input.cubicCapacity ?? null,
      input.cargoTanks ?? null,
      input.tankCoating ?? null,
      input.maxCargoTemp ?? null,
      input.minCargoTemp ?? null,
      input.maxPressure ?? null,
      input.avgSpeed ?? null,
      input.fuelConsumption ?? null,
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

  const fieldMappings: Array<[keyof UpdateVesselInput, string]> = [
    ['name', 'name'],
    ['imo', 'imo'],
    ['type', 'type'],
    ['subtype', 'subtype'],
    ['flag', 'flag'],
    ['classification', 'classification'],
    ['buildYear', 'buildYear'],
    ['drydockDue', 'drydockDue'],
    ['dwt', 'dwt'],
    ['summerDraft', 'summerDraft'],
    ['cubicCapacity', 'cubicCapacity'],
    ['cargoTanks', 'cargoTanks'],
    ['tankCoating', 'tankCoating'],
    ['maxCargoTemp', 'maxCargoTemp'],
    ['minCargoTemp', 'minCargoTemp'],
    ['maxPressure', 'maxPressure'],
    ['avgSpeed', 'avgSpeed'],
    ['fuelConsumption', 'fuelConsumption'],
    ['eta', 'eta'],
    ['port', 'port'],
    ['image', 'image'],
  ];

  for (const [key, column] of fieldMappings) {
    if (input[key] !== undefined) {
      updates.push(`${column} = ?`);
      values.push(input[key] as string | number | null);
    }
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
  
  const rows = await database.getAllAsync<VesselRow>(
    'SELECT * FROM vessels WHERE name LIKE ? OR imo LIKE ? ORDER BY createdAt DESC',
    [searchTerm, searchTerm]
  );

  return rows.map(rowToVessel);
}

/**
 * Get vessels by type
 */
export async function getVesselsByType(type: string): Promise<Vessel[]> {
  const database = await getDatabase();
  
  const rows = await database.getAllAsync<VesselRow>(
    'SELECT * FROM vessels WHERE type = ? ORDER BY createdAt DESC', 
    [type]
  );

  return rows.map(rowToVessel);
}

// ============================================
// SEED DATA (for initial setup)
// ============================================

// Seed data type matching dummy_boat_data.json structure
export interface SeedVesselData {
  id: string;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  flag?: string;
  classification?: string;
  buildYear?: number;
  drydockDue?: string;
  dwt?: number;
  summerDraft?: number;
  cubicCapacity?: number;
  cargoTanks?: number;
  tankCoating?: string;
  maxCargoTemp?: number;
  minCargoTemp?: number;
  maxPressure?: number;
  avgSpeed?: number;
  fuelConsumption?: number;
  eta?: string;
  port?: string;
  image?: string;
  hasQ88?: boolean;
  // KPI related data for seeding
  currentSpeed?: number;
  currentFuelConsumption?: number;
  currentCargoTemp?: number;
  charterPartySpeed?: number;
  charterPartyFuelAllowance?: number;
  requiredMinCargoTemp?: number;
  hasActiveVoyage?: boolean;
  hasCharterParty?: boolean;
}

/**
 * Seed initial data from dummy JSON
 */
export async function seedInitialData(dummyData: SeedVesselData[]): Promise<void> {
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
      const vessel = await createVessel({
        name: item.name,
        imo: item.imo,
        type: item.type,
        subtype: item.subtype,
        flag: item.flag ?? null,
        classification: item.classification ?? null,
        buildYear: item.buildYear ?? null,
        drydockDue: item.drydockDue ?? null,
        dwt: item.dwt ?? null,
        summerDraft: item.summerDraft ?? null,
        cubicCapacity: item.cubicCapacity ?? null,
        cargoTanks: item.cargoTanks ?? null,
        tankCoating: item.tankCoating ?? null,
        maxCargoTemp: item.maxCargoTemp ?? null,
        minCargoTemp: item.minCargoTemp ?? null,
        maxPressure: item.maxPressure ?? null,
        avgSpeed: item.avgSpeed ?? null,
        fuelConsumption: item.fuelConsumption ?? null,
        eta: item.eta ?? null,
        port: item.port ?? null,
        image: item.image ?? null,
        hasQ88: item.hasQ88 ?? false,
      });

      // Seed noon report if KPI data provided
      if (item.currentSpeed !== undefined || item.currentFuelConsumption !== undefined || item.currentCargoTemp !== undefined) {
        await database.runAsync(
          `INSERT INTO noon_reports (vesselId, reportDate, currentSpeed, fuelConsumed, cargoTemp)
           VALUES (?, ?, ?, ?, ?)`,
          [
            vessel.id,
            new Date().toISOString(),
            item.currentSpeed ?? null,
            item.currentFuelConsumption ?? null,
            item.currentCargoTemp ?? null,
          ]
        );
      }

      // Seed charter party if data provided
      if (item.hasCharterParty && (item.charterPartySpeed !== undefined || item.charterPartyFuelAllowance !== undefined)) {
        const cpResult = await database.runAsync(
          `INSERT INTO charter_parties (vesselId, warrantySpeed, fuelAllowance, startDate)
           VALUES (?, ?, ?, ?)`,
          [
            vessel.id,
            item.charterPartySpeed ?? null,
            item.charterPartyFuelAllowance ?? null,
            new Date().toISOString(),
          ]
        );

        // Seed voyage if active voyage data provided
        if (item.hasActiveVoyage) {
          await database.runAsync(
            `INSERT INTO voyages (vesselId, voyageNumber, origin, destination, requiredMinTemp, status, charterPartyId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              vessel.id,
              `V${vessel.id}001`,
              item.port ?? 'Origin Port',
              'Destination Port',
              item.requiredMinCargoTemp ?? null,
              'in_progress',
              cpResult.lastInsertRowId,
            ]
          );
        }
      } else if (item.hasActiveVoyage) {
        // Voyage without charter party
        await database.runAsync(
          `INSERT INTO voyages (vesselId, voyageNumber, origin, destination, requiredMinTemp, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            vessel.id,
            `V${vessel.id}001`,
            item.port ?? 'Origin Port',
            'Destination Port',
            item.requiredMinCargoTemp ?? null,
            'in_progress',
          ]
        );
      }
    } catch (error) {
      console.error(`Failed to seed vessel ${item.name}:`, error);
    }
  }

  console.log('Seeding complete!');
}

/**
 * Reset database (for development/testing)
 * Drops all tables and reinitializes the schema
 */
export async function resetDatabase(): Promise<void> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('safarban.db');
  }
  
  // Drop all tables
  await db.execAsync(`
    DROP TABLE IF EXISTS noon_reports;
    DROP TABLE IF EXISTS voyages;
    DROP TABLE IF EXISTS charter_parties;
    DROP TABLE IF EXISTS vessels;
  `);
  
  // Reinitialize with new schema
  await initializeDatabase();
  console.log('Database reset complete');
}

// ============================================
// KPI DATA OPERATIONS
// ============================================

/**
 * Get latest noon report for a vessel
 */
export async function getLatestNoonReport(vesselId: number): Promise<{
  currentSpeed: number | null;
  fuelConsumed: number | null;
  cargoTemp: number | null;
  reportDate: string;
} | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    currentSpeed: number | null;
    fuelConsumed: number | null;
    cargoTemp: number | null;
    reportDate: string;
  }>(
    'SELECT currentSpeed, fuelConsumed, cargoTemp, reportDate FROM noon_reports WHERE vesselId = ? ORDER BY reportDate DESC LIMIT 1',
    [vesselId]
  );
  return row || null;
}

/**
 * Get active charter party for a vessel
 */
export async function getActiveCharterParty(vesselId: number): Promise<{
  warrantySpeed: number | null;
  fuelAllowance: number | null;
} | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    warrantySpeed: number | null;
    fuelAllowance: number | null;
  }>(
    'SELECT warrantySpeed, fuelAllowance FROM charter_parties WHERE vesselId = ? AND (endDate IS NULL OR endDate > datetime("now")) ORDER BY startDate DESC LIMIT 1',
    [vesselId]
  );
  return row || null;
}

/**
 * Get active voyage for a vessel
 */
export async function getActiveVoyage(vesselId: number): Promise<{
  voyageNumber: string;
  requiredMinTemp: number | null;
  destination: string;
} | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    voyageNumber: string;
    requiredMinTemp: number | null;
    destination: string;
  }>(
    'SELECT voyageNumber, requiredMinTemp, destination FROM voyages WHERE vesselId = ? AND status = "in_progress" ORDER BY createdAt DESC LIMIT 1',
    [vesselId]
  );
  return row || null;
}
