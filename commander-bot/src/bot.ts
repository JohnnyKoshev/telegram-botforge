import {
    Bot,
    Context,
    GrammyError,
    HttpError,
    MemorySessionStorage,
    session,
    SessionFlavor,
} from 'grammy';
import * as alisaDB from './db/alisaDB';
import * as guardianDB from './db/guardianDB';
import * as commanderBotDB from './db/commanderBotDB';
import { handleMainMenu } from './services/bot/bot.service';
import {
    Conversation,
    ConversationFlavor,
    conversations,
    createConversation,
} from '@grammyjs/conversations';
import {
    accessRightsCallbackQueryListener,
    handleAccessRights,
    handleCallbackAddAccessRight,
    handleCallbackProcessCatalogues,
    handleCallbackRemoveAccessRight,
    handleCallbackShowAccessRight,
} from './services/bot/accessRights.service';
import {
    handleCatalogues,
    handleCallbackNewCatalogue,
    cataloguesCallbackQueryListener,
    handleCallbackAddCatalogueValue,
    handleCallbackRemoveCatalogueValue,
    handleCallbackShowCatalogueValues,
} from './services/bot/catalogues.service';
import {
    addBacklogQueryListener,
    handleAddBacklog,
    handleCallbackAddBacklogValue,
} from './services/bot/backlog.service';
import {
    handleWhatIsNew,
    whatIsNewQueryListener,
} from './services/bot/whatIsNew.service';
import { handleHelp, processHelp } from './services/bot/help.service';
import envMap from './env';
import {
    handleOpcValiSu,
    handleOpcValiSuChangeLineSettings,
    opcValiSuCallbackQueryListener,
} from './services/bot/opcValiSu.service';
import { processError } from '../../shared-lib/utils';
import { config } from 'dotenv';

config({ path: '../../.env_commanderBot' });

export type MyContext = Context &
    ConversationFlavor &
    SessionFlavor<SessionData>;
export type MyConversation = Conversation<MyContext>;

interface SessionData {
    currentState: null | string;
    catalogueName: string;
    catalogue: {
        translitName: string;
        userTgId: number;
    };
    backlogType: string;
    whatIsNew: {
        backlogIndex: number;
    };
}

const bot = new Bot<MyContext>(envMap.BOT_TOKEN || '');

bot.use(
    session({
        initial: (): SessionData => ({
            currentState: null,
            catalogueName: '',
            catalogue: {
                translitName: '',
                userTgId: -1,
            },
            backlogType: '',
            whatIsNew: {
                backlogIndex: -1,
            },
        }),
        storage: new MemorySessionStorage(),
    })
);
bot.use(conversations());

bot.catch(async (err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    let errorMsg = '';
    let errorCtx = `Пользователь с ID: ${ctx.from?.id}\nЮзернейм: ${ctx.from?.username}\nИмя: ${ctx.from?.first_name}`;
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error('Error in request:', e.description);
        errorMsg = processError(
            'Commander Bot',
            e.description,
            errorCtx,
            e.stack
        );
    } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e.message);
        errorMsg = processError('Commander Bot', e.message, errorCtx, e.stack);
    } else if (e instanceof Error) {
        console.error('Error:', e.message);
        errorMsg = processError('Commander Bot', e.message, errorCtx, e.stack);
    }
    if (errorMsg) {
        const superAdmins = await guardianDB.findSuperAdmins();
        for (const admin of superAdmins) {
            await ctx.api.sendMessage(admin.tgChatId, errorMsg);
        }

        // await ctx.api.sendMessage(158451380, errorMsg);
    }
});

console.log('Bot started');

export async function handleStart(ctx: Context) {
    await ctx.reply('Здравствуйте, вас приветствует Commander Bot!');
    console.log('User started bot:', ctx.from);
    const guardianUser = await guardianDB.findGuardianUserByTgId(ctx.from!.id);

    const isUserFound = !!guardianUser;
    const isUserSU = guardianUser?.tgBotsCommanderSuperAdmin;
    const isUserActive = guardianUser?.isUserActive;

    if (isUserFound && ctx.from?.id !== 158451380) {
        const alisaUser = await alisaDB.getUserByStaffId(guardianUser!.stffID);
        await commanderBotDB.insertUser(
            {
                tgId: ctx.from!.id,
                name: alisaUser ? alisaUser.name : 'Неизвестный пользователь',
            },
            isUserSU
        );
    }

    if (
        (isUserActive && isUserFound && isUserSU) ||
        ctx.from?.id === 158451380
    ) {
        await bot.api.setMyCommands(
            [
                {
                    command: 'opc_vali_su',
                    description: 'Настройки opc.vali.su',
                },
                { command: 'add_backlog', description: 'Добавить BackLog' },
                { command: 'catalogues', description: 'Справочники' },
                { command: 'access_rights', description: 'Права доступа' },
                { command: 'what_is_new', description: 'Что нового?' },
                { command: 'help', description: 'Ошибка или предложение?' },
                { command: 'main_menu', description: 'В главное меню' },
            ],
            {
                scope: { type: 'chat', chat_id: ctx.chat!.id },
            }
        );
        await commanderBotDB.updateAccessRight(ctx.from!.id, {
            isCommanderBot: true,
            isBacklog: true,
            isOpcValiSu: true,
        });
    } else if (isUserActive && isUserFound && !isUserSU) {
        await bot.api.setMyCommands(
            [
                {
                    command: 'opc_vali_su',
                    description: 'Настройки opc.vali.su',
                },
                { command: 'add_backlog', description: 'Добавить BackLog' },
                { command: 'catalogues', description: 'Справочники' },
                { command: 'what_is_new', description: 'Что нового?' },
                { command: 'help', description: 'Ошибка или предложение?' },
                { command: 'main_menu', description: 'В главное меню' },
            ],
            {
                scope: { type: 'chat', chat_id: ctx.chat!.id },
            }
        );
    } else if (!isUserFound || !isUserActive) {
        await bot.api.setMyCommands(
            [
                { command: 'help', description: 'Ошибка или предложение?' },
                { command: 'main_menu', description: 'В главное меню' },
            ],
            {
                scope: { type: 'chat', chat_id: ctx.chat!.id },
            }
        );
    }
}

bot.use(createConversation(handleCallbackAddAccessRight));
bot.use(createConversation(handleCallbackRemoveAccessRight));
bot.use(createConversation(handleCallbackShowAccessRight));
bot.use(createConversation(handleCallbackProcessCatalogues));

bot.use(createConversation(handleCallbackNewCatalogue));
bot.use(createConversation(handleCallbackAddCatalogueValue));
bot.use(createConversation(handleCallbackRemoveCatalogueValue));
bot.use(createConversation(handleCallbackShowCatalogueValues));

bot.use(createConversation(handleCallbackAddBacklogValue));

bot.use(createConversation(processHelp));

bot.use(createConversation(handleOpcValiSuChangeLineSettings));

bot.command('start', handleStart);
bot.command('opc_vali_su', handleOpcValiSu);
bot.command('add_backlog', handleAddBacklog);
bot.command('catalogues', handleCatalogues);
bot.command('access_rights', handleAccessRights);
bot.command('what_is_new', handleWhatIsNew);
bot.command('help', handleHelp);
bot.command('main_menu', handleMainMenu);

accessRightsCallbackQueryListener(bot);
cataloguesCallbackQueryListener(bot);
addBacklogQueryListener(bot);
whatIsNewQueryListener(bot);
opcValiSuCallbackQueryListener(bot);

bot.on('callback_query:data', async (ctx) => {
    console.log('Unknown Inline button pressed:', ctx.callbackQuery?.data);
    await ctx.answerCallbackQuery();
});

async function onStartup() {
    await alisaDB.initPool();
    await guardianDB.initClient();
}

async function onShutdown() {
    await alisaDB.closePool();
    await guardianDB.closeClient();
}

async function main() {
    await onStartup();
    await bot.start();
}

process.once('SIGINT', async () => {
    await onShutdown();
    await bot.stop();
    process.exit(0);
});

main();
