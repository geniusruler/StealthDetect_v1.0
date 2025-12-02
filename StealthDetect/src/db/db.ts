// Simplified & Correct Singleton SQLite Setup for Capacitor
// ---------------------------------------------------------
import { Capacitor } from '@capacitor/core';

import {
    CapacitorSQLite,
    SQLiteConnection,
    SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { createAllTables } from './schema';
import { seedAllTables } from './defaultData';

// Singleton instances
let sqlite: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

const DB_NAME = 'stealthdetect.db';

// ---------------------------------------------------------
// 1. Initialize DB + return a shared connection
// ---------------------------------------------------------
export const getDb = async (): Promise<SQLiteDBConnection> => {
    if (db) {
        console.log('[DB] Reusing existing connection');
        return db;
    }

    if (!sqlite) {
        console.log('[DB] Creating SQLiteConnection');
        sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    const platform = Capacitor.getPlatform();
    console.log('[DB] Platform:', platform);

    console.log('[DB] Creating connection to', DB_NAME);
    db = await sqlite.createConnection(
        DB_NAME,
        false,          // encrypted
        'no-encryption',
        1,              // version
        false           // readonly
    );

    console.log('[DB] Opening database');
    await db.open();
    console.log('[DB] Database opened');

    return db;
};

// ---------------------------------------------------------
// 2. Initialize schema (runs once on app bootstrap)
// ---------------------------------------------------------
export const initDB = async (): Promise<void> => {
    console.log('[DB] initDB starting');

    const conn = await getDb();

    try {
        // Create tables if they don't exist
        if (Array.isArray(createAllTables)) {
            console.log('[DB] Running table creation statements (array)');
            for (const stmt of createAllTables) {
                const sql = stmt.trim();
                if (!sql) continue;
                console.log('[DB] Executing:', sql);
                await conn.run(sql);
            }
        } else if (typeof createAllTables === 'string') {
            console.log('[DB] Running table creation statements (string)');
            const statements = createAllTables
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length);

            for (const stmt of statements) {
                console.log('[DB] Executing:', stmt);
                await conn.run(stmt);
            }
        } else {
            console.warn('[DB] createAllTables is empty or invalid');
        }
        
        // Prepopulate tables with default data
        if (seedAllTables && typeof seedAllTables === 'string') {
            console.log('[DB] Running seed statements');
            const seedStatements = seedAllTables
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length);

            for (const stmt of seedStatements) {
                console.log('[DB] Executing seed:', stmt);
                try {
                    await conn.run(stmt);
                } catch (seedErr) {
                    // don't abort on a single seed failure; log and continue
                    console.warn('[DB] Seed statement failed (continuing):', seedErr);
                }
            }
        }

        console.log('[DB] initDB finished successfully');
    } catch (err) {
        console.error('[DB] initDB error', err);
        throw err;
    }
};