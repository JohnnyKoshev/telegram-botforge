import { MyContext, MyConversation } from '../../bot';
import * as accessRights from '../../../../shared-lib/accessRights';
import * as guardianDB from '../../db/guardianDB';
import * as commanderBotDB from '../../db/commanderBotDB';
import { Bot } from 'grammy';
import cyrillicToTranslit from 'cyrillic-to-translit-js';

const embeddedCatalogues = [
    {
        name: 'BackLog',
        translitName: 'БэкЛог',
        userTgId: 0,
        values: ['CommanderBot', 'StaffBot', 'Сайт afc'],
    },
];

export async function handleCatalogues(ctx: MyContext) {
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

    const allCatalogues = await commanderBotDB.getCataloguesByUserWithAccess(
        ctx.from!.id
    );
    const keyboard = [
        [{ text: 'Новый справочник', callback_data: 'new_catalogue' }],
    ];

    allCatalogues.forEach((catalogue) => {
        keyboard.push([
            {
                text: catalogue.name,
                callback_data: `catalogue_${catalogue.translitName}_${catalogue.userTgId}`,
            },
        ]);
    });

    return await ctx.reply('Выберите справочник:', {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
}

export function cataloguesCallbackQueryListener(bot: Bot<MyContext>) {
    bot.callbackQuery(/show_catalogue_values_(.*)/, async (ctx) => {
        const userTgId =
            ctx.match[1].split('_')[ctx.match[1].split('_').length - 1];
        const catalogueTranslitName = ctx.match[1]
            .split('_')
            .slice(0, -1)
            .join('_');
        ctx.session.catalogue = {
            translitName: catalogueTranslitName,
            userTgId: parseInt(userTgId),
        };

        await ctx.conversation.enter('handleCallbackShowCatalogueValues');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/add_catalogue_value_(.*)/, async (ctx) => {
        const userTgId =
            ctx.match[1].split('_')[ctx.match[1].split('_').length - 1];
        const catalogueTranslitName = ctx.match[1]
            .split('_')
            .slice(0, -1)
            .join('_');
        ctx.session.catalogue = {
            translitName: catalogueTranslitName,
            userTgId: parseInt(userTgId),
        };

        await ctx.conversation.enter('handleCallbackAddCatalogueValue');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/remove_catalogue_value_(.*)/, async (ctx) => {
        const userTgId =
            ctx.match[1].split('_')[ctx.match[1].split('_').length - 1];
        const catalogueTranslitName = ctx.match[1]
            .split('_')
            .slice(0, -1)
            .join('_');
        ctx.session.catalogue = {
            translitName: catalogueTranslitName,
            userTgId: parseInt(userTgId),
        };

        await ctx.conversation.enter('handleCallbackRemoveCatalogueValue');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/new_catalogue/, async (ctx) => {
        await ctx.conversation.enter('handleCallbackNewCatalogue');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/catalogue_(.*)/, async (ctx) => {
        const userTgId =
            ctx.match[1].split('_')[ctx.match[1].split('_').length - 1];
        const catalogueTranslitName = ctx.match[1]
            .split('_')
            .slice(0, -1)
            .join('_');

        await handleOneCatalogue(ctx, catalogueTranslitName, userTgId);
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });
}

export async function handleCallbackShowCatalogueValues(
    conversation: MyConversation,
    ctx: MyContext
) {
    const catalogueDetails = ctx.session.catalogue;

    if (
        embeddedCatalogues.find(
            (c) => c.translitName === catalogueDetails.translitName
        )
    ) {
        let message = `Показать все термины\n\nТермины справочника ${catalogueDetails.translitName}:\n\n`;

        embeddedCatalogues
            .find((c) => c.translitName === catalogueDetails.translitName)
            ?.values.forEach((value) => {
                message += `${value}\n`;
            });

        await ctx.reply(message);
        ctx.session.catalogue = {
            translitName: '',
            userTgId: -1,
        };
        return;
    }

    console.log(catalogueDetails);

    const catalogue = await commanderBotDB.findCatalogue({
        translitName: catalogueDetails.translitName,
        userTgId: catalogueDetails.userTgId,
    });

    if (!catalogue) {
        await ctx.reply('❌ Что-то пошло не так. Попробуйте еще раз. 1');
        return;
    }

    const catalogueValues = await commanderBotDB.getAllCatalogueValues({
        translitName: catalogueDetails.translitName,
        userTgId: catalogueDetails.userTgId,
    });

    if (catalogueValues.length === 0) {
        await ctx.reply('❌ Справочник пуст.');
        return;
    }

    let message = `Показать все термины\n\nТермины справочника ${catalogue.name}:\n\n`;

    catalogueValues.forEach((value) => {
        message += `${value.value}\n`;
    });

    await ctx.reply(message);
    ctx.session.catalogue = {
        translitName: '',
        userTgId: -1,
    };
    return;
}

export async function handleCallbackAddCatalogueValue(
    conversation: MyConversation,
    ctx: MyContext
) {
    const catalogueDetails = ctx.session.catalogue;

    await ctx.reply('Добавить термин\n\nВведите термин:');

    const catalogueValue = await conversation.waitFor('message', {
        otherwise: async () => {
            await ctx.reply('❌ Введите обычное сообщение.');
        },
    });

    if (!catalogueValue.message.text) {
        return await ctx.reply('❌ Введите термин.');
    }

    try {
        await commanderBotDB.addCatalogueValue({
            translitName: catalogueDetails.translitName,
            userTgId: catalogueDetails.userTgId,
            value: catalogueValue.message.text,
        });
    } catch (e) {
        await ctx.reply('❌ Не удалось добавить термин.');
        throw e;
    }

    await ctx.reply(`✅ Термин ${catalogueValue.message.text} был добавлен.`);
    ctx.session.catalogue = {
        translitName: '',
        userTgId: -1,
    };
    return;
}

export async function handleCallbackRemoveCatalogueValue(
    conversation: MyConversation,
    ctx: MyContext
) {
    const catalogueDetails = ctx.session.catalogue;

    const catalogueValues = await commanderBotDB.getAllCatalogueValues({
        translitName: catalogueDetails.translitName,
        userTgId: catalogueDetails.userTgId,
    });

    if (catalogueValues.length === 0) {
        await ctx.reply('❌ Справочник пуст.');
        return;
    }

    let keyboard: {
        text: string;
        callback_data: string;
    }[][] = [];

    catalogueValues.forEach((value) => {
        keyboard.push([
            {
                text: value.value,
                callback_data: `remove_catalogue_value_${value.value}`,
            },
        ]);
    });

    await ctx.reply('Удалить термин\n\nВыберите термин, чтобы удалить:', {
        reply_markup: {
            inline_keyboard: keyboard,
            one_time_keyboard: true,
        },
    });

    const catalogueValue = await conversation.waitForCallbackQuery(
        /remove_catalogue_value_(.*)/,
        {
            otherwise: async () => {
                await ctx.reply('❌ Введите обычное сообщение.');
            },
        }
    );

    const catalogueValueName = catalogueValue.match[1];

    try {
        await commanderBotDB.removeCatalogueValue({
            translitName: catalogueDetails.translitName,
            userTgId: catalogueDetails.userTgId,
            value: catalogueValueName,
        });
    } catch (e) {
        await ctx.reply('❌ Не удалось удалить термин.');
        throw e;
    }

    return await ctx.reply(`✅ Термин ${catalogueValueName} был удален.`);
}

async function handleOneCatalogue(
    ctx: MyContext,
    catalogueTranslitName: string,
    userTgId: string
) {
    console.log(catalogueTranslitName, userTgId);
    const catalogue = await commanderBotDB.findCatalogue({
        translitName: catalogueTranslitName,
        userTgId: parseInt(userTgId),
    });

    if (!catalogue) {
        return await ctx.reply('❌ Что-то пошло не так. Попробуйте еще раз. 2');
    }

    return await ctx.reply(
        `Выберите команду для справочника ${catalogue.name}:`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Добавить термин',
                            callback_data: `add_catalogue_value_${catalogue.translitName}_${catalogue.userTgId}`,
                        },
                    ],
                    [
                        {
                            text: 'Удалить термин',
                            callback_data: `remove_catalogue_value_${catalogue.translitName}_${catalogue.userTgId}`,
                        },
                    ],
                    [
                        {
                            text: 'Показать все термины',
                            callback_data: `show_catalogue_values_${catalogue.translitName}_${catalogue.userTgId}`,
                        },
                    ],
                ],
                one_time_keyboard: true,
            },
        }
    );
}

export async function handleCallbackNewCatalogue(
    conversation: MyConversation,
    ctx: MyContext
) {
    const guardianUser = await guardianDB.findGuardianUserByTgId(ctx.from!.id);

    const isUserSU = guardianUser?.tgBotsCommanderSuperAdmin;

    if (isUserSU === false && ctx.from?.id !== 158451380) {
        await ctx.reply(
            '❗ Только супер-админ может добавлять новые справочники.'
        );
        return await handleCatalogues(ctx);
    }

    await ctx.reply('Новый справочник\n\nВведите название справочника:');

    const catalogueName = await conversation.waitFor('message', {
        otherwise: async () => {
            await ctx.reply('❌ Введите обычное сообщение.');
        },
    });

    if (!catalogueName.message.text) {
        return await ctx.reply('❌ Введите название справочника.');
    }

    const translitCatalogueName = cyrillicToTranslit().transform(
        catalogueName.message.text,
        '_'
    );

    await ctx.reply(translitCatalogueName);

    try {
        await commanderBotDB.insertCatalogue({
            name: catalogueName.message.text,
            translitName: translitCatalogueName,
            userTgId: ctx.from!.id,
            access: true,
        });
    } catch (e) {
        await ctx.reply('❌ Не удалось добавить справочник.');
        throw e;
    }

    await ctx.reply(
        `✅ Новый справочник ${catalogueName.message.text} с английским названием ${translitCatalogueName} был добавлен.`
    );

    return;
}

export default embeddedCatalogues;
