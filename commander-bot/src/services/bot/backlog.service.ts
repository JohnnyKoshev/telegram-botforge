import { Bot, Context } from 'grammy';
import * as accessRights from '../../../../shared-lib/accessRights';
import * as guardianDB from '../../db/guardianDB';
import embeddedCatalogues from './catalogues.service';
import { MyContext, MyConversation } from '../../bot';
import { addBacklog } from '../../db/commanderBotDB';
import moment from 'moment';

export async function handleAddBacklog(ctx: Context) {
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

    const inlineKeyboard = Array.from(
        embeddedCatalogues[0].values.map((catalogue) => [
            {
                text: catalogue,
                callback_data: `addBacklogValue_${catalogue}`,
            },
        ])
    );

    await ctx.reply('Выберите раздел, для которого нужно добавить BackLog::', {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
            one_time_keyboard: true,
        },
    });
}

export function addBacklogQueryListener(bot: Bot<MyContext>) {
    bot.callbackQuery(/addBacklogValue_(.*)/, async (ctx) => {
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

        const backlogType = ctx.match[1];

        ctx.session.backlogType = backlogType;
        await ctx.reply(
            `Отправьте мне новую запись Backlog для ${backlogType}`
        );

        await ctx.conversation.enter('handleCallbackAddBacklogValue');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });
}

export async function handleCallbackAddBacklogValue(
    conversation: MyConversation,
    ctx: MyContext
) {
    const backlogText = await conversation.waitFor('message', {
        otherwise: async (ctx) => {
            await ctx.reply('Пожалуйста, отправьте текст');
        },
    });

    if (!backlogText.message.text) {
        await ctx.reply('Пожалуйста, отправьте текст');
        return;
    }

    const backlog = {
        name: ctx.session.backlogType,
        creatorTgId: ctx.from!.id,
        text: backlogText.message.text,
    };

    try {
        const dbBacklog = await addBacklog(backlog);
        await ctx.reply(
            `✅ BackLog для ${dbBacklog.name} был добавлен:\n` +
                `${moment(dbBacklog.createdAt).format('DD-MM-YYYY')}\n` +
                `${dbBacklog.text}\n`
        );
    } catch (e) {
        await ctx.reply('❌ Ошибка при добавлении Backlog');
        throw e;
    }
}
