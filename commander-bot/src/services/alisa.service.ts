import * as alisaDB from '../db/alisaDB';

export async function filterUsersSurname(letters: string) {
    const users = await alisaDB.getAllUsers();
    return users.filter(
        (user) => user.name.split(' ')[0].slice(0, 3) === letters
    );
}
