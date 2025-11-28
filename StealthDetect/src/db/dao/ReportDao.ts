import { getDb } from '../db';

export interface Report {
    report_id: string;
    scan_id: string;
    summary: string;
    created_at: string;
    severity: string;
}

export type NewReport = Omit<Report, 'created_at'> & {
    created_at?: string;
};

export const ReportDao = {
    save: async (report: Report | NewReport): Promise<void> => {
        const db = await getDb();
        const { report_id, scan_id, summary, created_at, severity } = report;

        await db.run(
            `INSERT OR REPLACE INTO Report 
               (report_id, scan_id, summary, created_at, severity)
               VALUES (?, ?, ?, ?, ?);`,
            [
                report_id,
                scan_id,
                summary,
                created_at ?? new Date().toISOString(),
                severity,
            ]
        );
    },

    getByScanId: async (scan_id: string): Promise<Report[]> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM Report 
       WHERE scan_id = ? 
       ORDER BY created_at DESC;`,
            [scan_id]
        );
        const rows = (res.values ?? []) as Report[];
        return rows;
    },

    getById: async (report_id: string): Promise<Report | null> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM Report WHERE report_id = ?;`,
            [report_id]
        );
        const rows = (res.values ?? []) as Report[];
        return rows[0] ?? null;
    },

    deleteById: async (report_id: string): Promise<void> => {
        const db = await getDb();
        await db.run(
            `DELETE FROM Report WHERE report_id = ?;`,
            [report_id]
        );
    },
};