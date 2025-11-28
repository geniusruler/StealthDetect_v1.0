import { UserDao, NewUser } from '../src/db/dao/userDao';
import * as dbModule from '../src/db/db';

describe('UserDao.save', () => {
    it('saves a NewUser with null updated_at', async () => {
        const runMock = jest.fn().mockResolvedValue(undefined);
        const getDbMock = jest.spyOn(dbModule, 'getDb')
            .mockResolvedValue({ run: runMock } as any);

        const newUser: NewUser = {
            user_id: 'u1',
            username: 'alice',
            duress_pin: '2222',
            real_pin: '1111',
            created_at: new Date().toISOString(),
            updated_at: null, // or omit this field completely
        };

        await UserDao.save(newUser);

        expect(runMock).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR REPLACE INTO User'),
            [
                newUser.user_id,
                newUser.username,
                newUser.duress_pin,
                newUser.real_pin,
                newUser.created_at,
                null, // `updated_at ?? null` for NewUser
            ]
        );

        getDbMock.mockRestore();
    });
});