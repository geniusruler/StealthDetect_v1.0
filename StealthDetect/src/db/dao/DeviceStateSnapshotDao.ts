import { getDb } from '../db';

export interface DeviceStateSnapshot {
    snapshot_id: string;
    scan_id: string;
    battery_level: number;
    network_type: string;
    ip_address: string;
    created_at: string;
    raw_json?: string;
}

export type NewDeviceStateSnapshot = Omit<
    DeviceStateSnapshot,
    'created_at'
> & {
    created_at?: string;
};

export const DeviceStateSnapshotDao = {
    save: async (
        snap: DeviceStateSnapshot | NewDeviceStateSnapshot
    ): Promise<void> => {
        const db = await getDb();
        const {
            snapshot_id,
            scan_id,
            battery_level,
            network_type,
            ip_address,
            created_at,
            raw_json,
        } = snap;

        await db.run(
            `INSERT OR REPLACE INTO DeviceStateSnapshot
               (snapshot_id, scan_id, battery_level, network_type, ip_address, created_at, raw_json)
               VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
                snapshot_id,
                scan_id,
                battery_level,
                network_type,
                ip_address,
                created_at ?? new Date().toISOString(),
                raw_json ?? null,
            ]
        );
    },

    getByScanId: async (scan_id: string): Promise<DeviceStateSnapshot[]> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM DeviceStateSnapshot
             WHERE scan_id = ?
             ORDER BY created_at DESC;`,
            [scan_id]
        );
        const rows = (res.values ?? []) as DeviceStateSnapshot[];
        return rows;
    },

    deleteByScanId: async (scan_id: string): Promise<void> => {
        const db = await getDb();
        await db.run(
            `DELETE FROM DeviceStateSnapshot WHERE scan_id = ?;`,
            [scan_id]
        );
    },
};