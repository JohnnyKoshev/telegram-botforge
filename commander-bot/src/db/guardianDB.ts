import { MongoClient } from 'mongodb';
import envMap from '../env';

const uri = `mongodb://${envMap.GUARDIAN_MONGO_HOST}/${envMap.GUARDIAN_MONGO_DB}`;

let client: MongoClient | null = null;

export async function initClient() {
    client = new MongoClient(uri);
    await client.connect();
}

async function getClient() {
    if (!client) {
        await initClient();
    }
    return client;
}

export async function closeClient() {
    if (client) {
        await client.close();
    }
}

export async function findGuardianUserByTgId(tgId: number) {
    const client = await getClient();
    if (!client) {
        throw new Error('Mongo client is not initialized');
    }
    const db = client.db();
    const tgBotsStaff = db.collection('tgBots_staff');
    return tgBotsStaff.findOne({ tgChatId: tgId });
}

export async function findGuardianUserByStaffId(staffId: number) {
    const client = await getClient();
    if (!client) {
        throw new Error('Mongo client is not initialized');
    }
    const db = client.db();
    const tgBotsStaff = db.collection('tgBots_staff');
    return tgBotsStaff.findOne({ staffID: staffId });
}

export async function findSuperAdmins() {
    const client = await getClient();
    if (!client) {
        throw new Error('Mongo client is not initialized');
    }
    const db = client.db();
    const tgBotsStaff = db.collection('tgBots_staff');
    return tgBotsStaff.find({ tgBotsCommanderSuperAdmin: true }).toArray();
}
