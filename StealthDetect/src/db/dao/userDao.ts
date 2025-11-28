// TypeScript
// `StealthDetect/src/db/dao/userDao.ts`

import { getDb } from '../db';

export interface User {
    user_id: string;
    username: string;
    duress_pin: string;
    real_pin: string;
    created_at: string;
    updated_at?: string;
}

export type NewUser = Omit<User, 'updated_at'> & { updated_at?: null };

export const UserDao = {
    save: async (user: NewUser | User): Promise<void> => {
        const db = await getDb();
        const {
            user_id,
            username,
            duress_pin,
            real_pin,
            created_at,
            updated_at,
        } = user;

        await db.run(
            `INSERT OR REPLACE INTO User 
               (user_id, username, duress_pin, real_pin, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?);`,
            [
                user_id,
                username,
                duress_pin,
                real_pin,
                created_at,
                updated_at ?? null,
            ]
        );
    },

    getById: async (user_id: string): Promise<User | null> => {
        const db = await getDb();
        const res = await db.query<User>(
            `SELECT * FROM User WHERE user_id = ? LIMIT 1;`,
            [user_id]
        );
        const rows = res.values ?? [];
        return rows[0] ?? null;
    },

    getByUsername: async (username: string): Promise<User | null> => {
        const db = await getDb();
        const res = await db.query<User>(
            `SELECT * FROM User WHERE username = ? LIMIT 1;`,
            [username]
        );
        const rows = res.values ?? [];
        return rows[0] ?? null;
    },

    updatePins: async (
        user_id: string,
        real_pin: string,
        duress_pin: string
    ): Promise<void> => {
        const db = await getDb();
        const updated_at = new Date().toISOString();

        await db.run(
            `UPDATE User SET real_pin = ?, duress_pin = ?, updated_at = ?
       WHERE user_id = ?;`,
            [real_pin, duress_pin, updated_at, user_id]
        );
    },

    deleteById: async (user_id: string): Promise<void> => {
        const db = await getDb();
        await db.run(
            `DELETE FROM User WHERE user_id = ?;`,
            [user_id]
        );
    },
};