import { getDb } from '../db';

export interface AuthState {
    session_id: string;
    user_id: string;
    is_duress: number;
    logged_in_at: string;
    logged_out_at?: string;
}

export type NewAuthState = Omit<AuthState, 'logged_out_at'> & {
    logged_out_at?: null;
};

export const AuthDao = {
    save: async (session: AuthState | NewAuthState): Promise<void> => {
        const db = await getDb();
        const { session_id, user_id, is_duress, logged_in_at, logged_out_at } =
            session;

        await db.run(
            `INSERT OR REPLACE INTO AuthState
               (session_id, user_id, is_duress, logged_in_at, logged_out_at)
               VALUES (?, ?, ?, ?, ?);`,
            [
                session_id,
                user_id,
                is_duress,
                logged_in_at,
                logged_out_at ?? null,
            ]
        );
    },

    getActiveSession: async (user_id: string): Promise<AuthState | null> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM AuthState
             WHERE user_id = ? AND logged_out_at IS NULL
             ORDER BY logged_in_at DESC LIMIT 1;`,
            [user_id]
        );
        const rows = (res.values ?? []) as AuthState[];
        return rows[0] ?? null;
    },

    closeSession: async (session_id: string): Promise<void> => {
        const db = await getDb();
        const now = new Date().toISOString();

        await db.run(
            `UPDATE AuthState
             SET logged_out_at = ?
             WHERE session_id = ?;`,
            [now, session_id]
        );
    },

    getHistory: async (user_id: string): Promise<AuthState[]> => {
        const db = await getDb();
        const res = await db.query(
            `SELECT * FROM AuthState
             WHERE user_id = ?
             ORDER BY logged_in_at DESC;`,
            [user_id]
        );
        const rows = (res.values ?? []) as AuthState[];
        return rows;
    },

    deleteById: async (session_id: string): Promise<void> => {
        const db = await getDb();
        await db.run(
            `DELETE FROM AuthState WHERE session_id = ?;`,
            [session_id]
        );
    },
};