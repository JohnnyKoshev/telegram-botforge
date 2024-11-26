import { Bot } from 'grammy';
import * as accessRights from '../../../../shared-lib/accessRights';
import * as guardianDB from '../../db/guardianDB';
import * as commanderBotDB from '../../db/commanderBotDB';
import * as alisaDB from '../../db/alisaDB';
import { MyContext, MyConversation } from '../../bot';

export async function handleOpcValiSu(ctx: MyContext) {
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

    const inlineKeyboard = [
        [
            {
                text: 'Изменить настройки линий',
                callback_data: 'opcValiSu_change_line_settings',
            },
        ],
    ];

    await ctx.reply('Выберите действие для opc.vali.su:', {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
            one_time_keyboard: true,
        },
    });
}

export function opcValiSuCallbackQueryListener(bot: Bot<MyContext>) {
    bot.callbackQuery(/opcValiSu_change_line_settings/, async (ctx) => {
        await ctx.conversation.exit();
        await ctx.conversation.enter('handleOpcValiSuChangeLineSettings');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });
}

export async function handleOpcValiSuChangeLineSettings(
    conversation: MyConversation,
    ctx: MyContext
) {
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

    const inlineKeyboard = (await alisaDB.getAllLines()).map((line) => {
        return [
            {
                text: line.opcvalisu_line!,
                callback_data: `opcValiSu_line_${line.opcvalisu_line}`,
                one_time_keyboard: true,
            },
        ];
    });

    await ctx.reply('Выберите линию:', {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
            one_time_keyboard: true,
        },
    });

    let selectedCb;
    while (true) {
        let check: boolean = false;
        selectedCb = await conversation.waitForCallbackQuery(
            /opcValiSu_line_.*$/,
            {
                otherwise: async (ctx) => {
                    await ctx.reply('❌ Выберите линию из списка.');
                    check = true;
                },
            }
        );

        if (!check) {
            break;
        }
    }

    selectedCb.editMessageReplyMarkup();

    const line = selectedCb.match[0].split('_')[2];

    let desiredCard = await commanderBotDB.findCardNumber(line);

    if (!desiredCard) {
        try {
            desiredCard = await commanderBotDB.createCardNumber({
                discountCardNumberLine: line,
                discountCardNumberMin: -1,
                discountCardNumberMax: -1,
            });
        } catch (err) {
            await ctx.reply('❌ Что-то пошло не так. Попробуйте позже.');
            throw err;
        }
    }

    if (!desiredCard) {
        await ctx.reply('❌ Линия не найдена.');
        return;
    }

    let cardDescription = '';
    let cardInlineKeyboard: { text: string; callback_data: string }[][] = [];
    let counter = 1;
    for (let key in desiredCard) {
        if (counter > 2) {
            cardDescription += `${key}: ${desiredCard[key]}\n`;
            cardInlineKeyboard.push([
                {
                    text: key,
                    callback_data: `opcValiSu_update_${line}_${key}`,
                },
            ]);
        }
        counter++;
    }

    await ctx.reply(
        `Выберите поле, значение которого нужно изменить для линии ${desiredCard.discountCardNumberLine}:\n${cardDescription}`,
        {
            reply_markup: {
                inline_keyboard: cardInlineKeyboard,
                one_time_keyboard: true,
            },
        }
    );

    let selectedCb2;
    while (true) {
        let check: boolean = false;
        selectedCb2 = await conversation.waitForCallbackQuery(
            /opcValiSu_update_.*$/,
            {
                otherwise: async (ctx) => {
                    await ctx.reply('❌ Выберите поле из списка.');
                    check = true;
                },
            }
        );

        if (!check) {
            break;
        }
    }

    selectedCb2.editMessageReplyMarkup();

    const lineProperty = selectedCb2.match[0].split('_')[3];

    await ctx.reply(
        `Выберите поле, значение которого нужно изменить для линии ${line}:\n` +
            `Текущее значение поля ${lineProperty}: ${desiredCard[lineProperty]}\n` +
            'Отправьте мне новое значение этого поля:\n'
    );

    let newPropertyValue;
    while (true) {
        let check: boolean = false;
        newPropertyValue = await conversation.waitFor('message', {
            otherwise: async (ctx) => {
                await ctx.reply('❌ Отправьте мне новое значение поля.');
                check = true;
            },
        });
        console.log(newPropertyValue.message.text);
        if (isNaN(Number(newPropertyValue.message.text))) {
            await ctx.reply(
                `🚫 Такое значение для поля ${lineProperty} для линии ${line} ввести нельзя, введите значение еще раз:`
            );
            check = true;
        }

        if (!check) {
            break;
        }
    }

    try {
        await commanderBotDB.updateCardNumber(desiredCard.id, {
            [lineProperty]: Number(newPropertyValue.message.text),
        });
    } catch (err) {
        await ctx.reply('❌ Что-то пошло не так. Попробуйте позже.');
        throw err;
    }

    await ctx.reply(
        `✅ Новое значение ${lineProperty}: ${newPropertyValue.message.text} для линии ${line} сохранено.`
    );
}
