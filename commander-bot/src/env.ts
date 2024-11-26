import { configDotenv } from 'dotenv';

interface IEnvMap {
    BOT_TOKEN: string;
    GUARDIAN_MONGO_HOST: string;
    GUARDIAN_MONGO_DB: string;
    ALISA1READ_DB_HOST: string;
    ALISA1READ_DB_USER: string;
    ALISA1READ_DB_PASSWORD: string;
    ALISA1READ_DB_DATABASE_NAME: string;
    ALISA1READ_DB_PORT: string;
}

function getEnvMap(): IEnvMap {
    let { parsed } = configDotenv({
        path: '../../.env_commanderBot',
    });

    if (!parsed) {
        throw new Error('Error parsing .env file');
    }

    return Object.assign({}, parsed as unknown as IEnvMap);
}

let envMap: IEnvMap = getEnvMap();

export default envMap;
