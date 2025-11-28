import { getDb } from '../db';

export interface IOCMatch {
    match_id: string;
    scan_id: string;
    indicator_type: string;
    indicator_value: string;
    source: string;
    rule_version: string;
    confidence: number;
    severity: string;
}

export type NewIOCMatch = IOCMatch;

export const IOCMatchDao = {
    save: async (match: NewIOCMatch): Promise<void> => {
        const db = await getDb();
        const {
            match_id,
            scan_id,
            indicator_type,
            indicator_value,
            source,
            rule_version,
            confidence,
            severity,
        } = match;

        await db.run(
            `INSERT OR REPLACE INTO IOCMatch 
               (match_id, scan_id, indicator_type, indicator_value, source, rule_version, confidence, severity)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                match_id,
                scan_id,
                indicator_type,
                indicator_value,
                source,
                rule_version,
                confidence,
                severity,
            ]
        );
    },

    getByScanId: async (scan_id: string): Promise<IOCMatch[]> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM IOCMatch
             WHERE scan_id = ?
             ORDER BY severity DESC;`,
            [scan_id]
        );
        const rows = (res.values ?? []) as IOCMatch[];
        return rows;
    },

    getById: async (match_id: string): Promise<IOCMatch | null> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM IOCMatch WHERE match_id = ?;`,
            [match_id]
        );
        const rows = (res.values ?? []) as IOCMatch[];
        return rows[0] ?? null;
    },

    deleteById: async (match_id: string): Promise<void> => {
        const db = await getDb();
        await db.run(
            `DELETE FROM IOCMatch WHERE match_id = ?;`,
            [match_id]
        );
    },
};