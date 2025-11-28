import { getDb } from '../db';

export interface ScanSession {
    scan_id: string;
    user_id: string;
    started_at: string;
    ended_at?: string;
    mode: string;
    status: string;
    app_version: string;
}

export type NewScanSession = Omit<ScanSession, 'ended_at'> & {
    ended_at?: null;
};

export const ScanSessionDao = {
    save: async (session: ScanSession | NewScanSession): Promise<void> => {
        const db = await getDb();
        const {
            scan_id,
            user_id,
            started_at,
            ended_at,
            mode,
            status,
            app_version,
        } = session;

        await db.run(
            `INSERT OR REPLACE INTO ScanSession
       (scan_id, user_id, started_at, ended_at, mode, status, app_version)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
                scan_id,
                user_id,
                started_at,
                ended_at ?? null,
                mode,
                status,
                app_version,
            ]
        );
    },

    getAll: async (): Promise<ScanSession[]> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM ScanSession ORDER BY started_at DESC;`
        );
        const rows = (res.values ?? []) as ScanSession[];
        return rows;
    },

    getById: async (scan_id: string): Promise<ScanSession | null> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM ScanSession WHERE scan_id = ?;`,
            [scan_id]
        );
        const rows = (res.values ?? []) as ScanSession[];
        return rows[0] ?? null;
    },

    updateStatus: async (
        scan_id: string,
        status: string,
        ended_at?: string
    ): Promise<void> => {
        const db = await getDb();
        await db.run(
            `UPDATE ScanSession SET status = ?, ended_at = ? WHERE scan_id = ?;`,
            [status, ended_at ?? null, scan_id]
        );
    },

    deleteById: async (scan_id: string): Promise<void> => {
        const db = await getDb();
        await db.run(
            `DELETE FROM ScanSession WHERE scan_id = ?;`,
            [scan_id]
        );
    },
};