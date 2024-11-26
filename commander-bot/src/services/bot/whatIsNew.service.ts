import { Bot } from 'grammy';
import * as accessRights from '../../../../shared-lib/accessRights';
import * as guardianDB from '../../db/guardianDB';
import { getBacklogsByName } from '../../db/commanderBotDB';
import moment from 'moment';
import { MyContext } from '../../bot';
import { Backlog } from '@prisma/client';

const inlineKeyboard = [
    [
        {
            text: 'Назад',
            callback_data: `prevBacklog`,
        },
        {
            text: 'Вперед',
            callback_data: `nextBacklog`,
        },
        {
            text: 'Выход',
            callback_data: `exitBacklog`,
        },
    ],
];

let backlogs: Backlog[] = [];

async function getSortedBacklogs(name: string) {
    const backlogs = await getBacklogsByName(name);

    return backlogs.sort((a, b) => {
        return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    });
}

export async function handleWhatIsNew(ctx: MyContext) {
    if (
        (await accessRights.checkAllAccess(
            ctx,
            await guardianDB.findGuardianUserByTgId(ctx.from!.id),
            false
        )) !== 'success' &&
        ctx.from?.id !== 158451380
    ) {
        return;
    }

    const backlogSorted = await getSortedBacklogs('CommanderBot');
    if (!backlogSorted.length) {
        return await ctx.reply('Новых записей нет');
    }
    backlogs = backlogSorted;
    const latestBacklog = backlogs[0];

    ctx.session.whatIsNew.backlogIndex = 0;

    await ctx.reply(
        `${backlogSorted.length}/${backlogSorted.length} Что нового для CommanderBot:\n${moment(latestBacklog.createdAt).format('DD-MM-YYYY')}\n${latestBacklog.text}`,
        {
            reply_markup: {
                inline_keyboard: inlineKeyboard,
            },
        }
    );
}

export function whatIsNewQueryListener(bot: Bot<MyContext>) {
    bot.callbackQuery(/prevBacklog/, async (ctx) => {
        const neededBacklog = backlogs[ctx.session.whatIsNew.backlogIndex + 1];

        console.log(neededBacklog, ctx.session.whatIsNew.backlogIndex + 1);
        if (!neededBacklog) {
            return await ctx.answerCallbackQuery();
        }
        ctx.session.whatIsNew.backlogIndex++;

        await ctx.editMessageText(
            `${backlogs.length - ctx.session.whatIsNew.backlogIndex}/${backlogs.length} Что нового для CommanderBot:\n${moment(neededBacklog.createdAt).format('DD-MM-YYYY')}\n${neededBacklog.text}`,
            {
                reply_markup: {
                    inline_keyboard: inlineKeyboard,
                },
            }
        );
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery(/nextBacklog/, async (ctx) => {
        const neededBacklog = backlogs[ctx.session.whatIsNew.backlogIndex - 1];

        console.log(neededBacklog, ctx.session.whatIsNew.backlogIndex - 1);

        if (!neededBacklog) {
            return await ctx.answerCallbackQuery();
        }
        ctx.session.whatIsNew.backlogIndex--;

        await ctx.editMessageText(
            `${backlogs.length - ctx.session.whatIsNew.backlogIndex}/${backlogs.length} Что нового для CommanderBot:\n${moment(neededBacklog.createdAt).format('DD-MM-YYYY')}\n${neededBacklog.text}`,
            {
                reply_markup: {
                    inline_keyboard: inlineKeyboard,
                },
            }
        );

        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery(/exitBacklog/, async (ctx) => {
        await ctx.deleteMessage();
        await ctx.answerCallbackQuery();
    });
}
