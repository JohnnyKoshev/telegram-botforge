import mysql from 'mysql2/promise';
import envMap from '../env';

export interface IAlisaUser {
    stffID: number;
    name: string;
}

export interface IOpcValiSuLine {
    opcvalisu_line: string;
}

let pool: mysql.Pool | null = null;

export async function initPool() {
    pool = mysql.createPool({
        host: envMap.ALISA1READ_DB_HOST,
        user: envMap.ALISA1READ_DB_USER,
        password: envMap.ALISA1READ_DB_PASSWORD,
        database: envMap.ALISA1READ_DB_DATABASE_NAME,
        port: Number(envMap.ALISA1READ_DB_PORT),
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });
}

async function getPool() {
    if (!pool) {
        await initPool();
    }
    return pool;
}

export async function closePool() {
    if (pool) {
        await pool.end();
    }
}

export async function getUserByStaffId(
    staffId: number
): Promise<IAlisaUser | null> {
    const pool = await getPool();
    if (!pool) {
        throw new Error('MySQL pool is not initialized');
    }
    const [rows] = await pool.query(
        'SELECT * FROM tgBots_staff WHERE stffID = ?',
        [staffId]
    );
    return rows[0] ? (rows[0] as IAlisaUser) : null;
}

export async function getAllUsers(): Promise<IAlisaUser[]> {
    const pool = await getPool();
    if (!pool) {
        throw new Error('MySQL pool is not initialized');
    }
    const [rows] = await pool.query('SELECT * FROM tgBots_staff');

    let rowsArray = rows as IAlisaUser[];
    rowsArray = rowsArray.sort((a, b) => ('' + a.name).localeCompare(b.name));
    return rowsArray ? rowsArray : [];
}

export async function getAllLines(): Promise<IOpcValiSuLine[]> {
    const pool = await getPool();
    if (!pool) {
        throw new Error('MySQL pool is not initialized');
    }
    const [rows] = await pool.query('SELECT * FROM opcvalisu_line;');

    let rowsArray = rows as IOpcValiSuLine[];
    rowsArray = rowsArray.sort((a, b) =>
        ('' + a.opcvalisu_line).localeCompare(b.opcvalisu_line)
    );
    return rowsArray ? rowsArray : [];
}
