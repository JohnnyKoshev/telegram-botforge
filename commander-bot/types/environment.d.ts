export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            GUARDIAN_MONGO_HOST: string;
            GUARDIAN_MONGO_DB: string;
            ALISA1READ_DB_HOST: string;
            ALISA1READ_DB_USER: string;
            ALISA1READ_DB_PORT: string;
            ALISA1READ_DB_PASSWORD: string;
            ALISA1READ_DB_DATABASE_NAME: string;
            BOT_TOKEN: string;
        }
    }
}
