import {
    insertUser,
    updateAccessRight,
    updateCatalogueAccess,
} from '../../db/commanderBotDB';
import { AccessRight } from '@prisma/client';
import { Bot, Context } from 'grammy';
import { filterUsersSurname } from '../alisa.service';
import { MyContext, MyConversation } from '../../bot';
import * as guardianDB from '../../db/guardianDB';
import * as commanderBotDB from '../../db/commanderBotDB';
import * as accessRights from '../../../../shared-lib/accessRights';
import { checkUserExistence } from '../utils';
import embeddedCatalogues from './catalogues.service';

export function accessRightsCallbackQueryListener(bot: Bot<MyContext>) {
    bot.callbackQuery(
        /add_(commanderBot|backlog|catalogues|opcValiSu)/,
        async (ctx) => {
            ctx.session.currentState = ctx.callbackQuery.data.split('_')[1];
            await ctx.conversation.exit();
            await ctx.conversation.enter('handleCallbackAddAccessRight');
            await ctx.answerCallbackQuery();
            await ctx.editMessageReplyMarkup();
        }
    );

    bot.callbackQuery(
        /remove_(commanderBot|backlog|catalogues|opcValiSu)/,
        async (ctx) => {
            ctx.session.currentState = ctx.callbackQuery.data.split('_')[1];
            await ctx.conversation.exit();
            await ctx.conversation.enter('handleCallbackRemoveAccessRight');
            await ctx.answerCallbackQuery();
            await ctx.editMessageReplyMarkup();
        }
    );

    bot.callbackQuery(
        /show_(commanderBot|backlog|catalogues|opcValiSu)/,
        async (ctx) => {
            ctx.session.currentState = ctx.callbackQuery.data.split('_')[1];
            await ctx.conversation.exit();
            await ctx.conversation.enter('handleCallbackShowAccessRight');
            await ctx.answerCallbackQuery();
            await ctx.editMessageReplyMarkup();
        }
    );

    bot.callbackQuery(/accessRights_commanderBot/, async (ctx) => {
        await displayAccessRightsMenu(ctx, 'commanderBot');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/accessRights_backlog/, async (ctx) => {
        await displayAccessRightsMenu(ctx, 'backlog');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/accessRights_catalogues/, async (ctx) => {
        await ctx.conversation.exit();
        await ctx.conversation.enter('handleCallbackProcessCatalogues');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });

    bot.callbackQuery(/accessRights_opcValiSu/, async (ctx) => {
        await displayAccessRightsMenu(ctx, 'opcValiSu');
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup();
    });
}

export async function addAccessRight(
    conversation,
    ctx,
    tgId,
    accessRight:
        | 'isCommanderBot'
        | 'isBacklog'
        | 'isCatalogues'
        | 'isOpcValiSu',
    opts?: { catalogueName?: string }
) {
    console.log('OPTS:', opts);
    console.log('CATALOGUE NAME:', conversation.session.catalogueName);
    const user = await checkUserExistence(tgId);

    if (!user) {
        return await ctx.reply(
            '❌ Пользователь не найден. Скорее всего, он не зарегистрирован в Клуботе'
        );
    }

    await insertUser(
        {
            tgId: tgId,
            name: user.name,
        },
        user.superuser
    );

    try {
        if (opts?.catalogueName) {
            await updateCatalogueAccess(opts.catalogueName, tgId, true);
        } else
            await updateAccessRight(tgId, {
                [accessRight]: true,
            } as unknown as AccessRight);
    } catch (e) {
        await ctx.reply('❌ Ошибка при добавлении прав доступа');
        throw e;
    }
    return await ctx.reply(
        `Права для ${
            accessRight === 'isCommanderBot'
                ? 'CommanderBot'
                : accessRight === 'isBacklog'
                  ? 'BackLog'
                  : accessRight === 'isCatalogues'
                    ? `справочника ${opts?.catalogueName}`
                    : 'opc.vali.su'
        } добавлены.` +
            ` Добавление пользователя.\n` +
            '\n' +
            '✅Пользователь добавлен. '
    );
}

export async function removeAccessRight(
    ctx,
    tgId,
    accessRight:
        | 'isCommanderBot'
        | 'isBacklog'
        | 'isCatalogues'
        | 'isOpcValiSu',
    opts?: { catalogueName?: string }
) {
    try {
        if (opts?.catalogueName) {
            await updateCatalogueAccess(
                opts.catalogueName,
                Number(tgId),
                false
            );
        } else
            await updateAccessRight(Number(tgId), {
                [accessRight]: false,
            } as unknown as AccessRight);
    } catch (e) {
        await ctx.reply('❌ Ошибка при удалении прав доступа');
        throw e;
    }

    return await ctx.reply(
        `Права для ${
            accessRight === 'isCommanderBot'
                ? 'CommanderBot'
                : accessRight === 'isBacklog'
                  ? 'BackLog'
                  : accessRight === 'isCatalogues'
                    ? `справочника ${opts?.catalogueName}`
                    : 'opc.vali.su'
        } удалены.` +
            ` удаление  пользователя.\n` +
            '\n' +
            '✅Пользователь удален. '
    );
}

export async function showAccessRights(ctx: MyContext, surnameLetters: string) {
    const users = await filterUsersSurname(surnameLetters);

    if (!users.length) {
        await ctx.reply('❌ Пользователи не найдены');
        return false;
    }

    const usersInlineKeyboard = users.map((user) => [
        {
            text: user.name,
            callback_data: `show_one_access_rights_${user.stffID}`,
        },
    ]);

    await ctx.reply('Показать права пользователя\nВыберите пользователя', {
        reply_markup: {
            inline_keyboard: usersInlineKeyboard,
            one_time_keyboard: true,
        },
    });
    return true;
}

export async function displayAccessRightsMenu(
    ctx: MyContext,
    accessRight: 'commanderBot' | 'backlog' | 'catalogues' | 'opcValiSu',
    conversation?,
    opts?: { catalogueName: string }
) {
    const mapAccessRightToText = {
        commanderBot: 'CommanderBot',
        backlog: 'BackLog',
        catalogues: 'Справочники',
        opcValiSu: 'opc.vali.su',
    };

    if (opts?.catalogueName) {
        conversation.session.catalogueName = opts.catalogueName;
        console.log('CATALOGUE NAME 2:', conversation.session.catalogueName);
    }

    const message = opts?.catalogueName
        ? `Выберите командду для изменения прав для справочника ${opts?.catalogueName}`
        : `Выберите действие для ${mapAccessRightToText[accessRight]}`;
    return await ctx.reply(message, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Добавить права',
                        callback_data: `add_${accessRight}`,
                    },
                ],
                [
                    {
                        text: 'Удалить права',
                        callback_data: `remove_${accessRight}`,
                    },
                ],
                [
                    {
                        text: 'Показать права',
                        callback_data: `show_${accessRight}`,
                    },
                ],
            ],
        },
    });
}

export async function handleCallbackShowAccessRight(
    conversation: MyConversation,
    ctx: MyContext
) {
    await ctx.reply(
        'Показать права пользователя\nВведите первые три буквы фамилии пользователя'
    );

    let userMsg;
    while (true) {
        let check: boolean = false;

        userMsg = await conversation.waitFor('message', {
            otherwise: async () => {
                await ctx.reply('❌ Введите обычное сообщение.');
                check = true;
            },
        });
        if (userMsg.message?.text?.length !== 3) {
            await ctx.reply('❌ Введите только три буквы.');
            check = true;
        }

        if (!check) {
            break;
        }
    }

    let success = false;
    try {
        success = await showAccessRights(ctx, userMsg.message.text);
    } catch (e) {
        throw e;
    }

    if (!success) {
        conversation.session.currentState = null;
        return;
    }

    const selectedCb = await conversation.waitForCallbackQuery(
        /show_one_access_rights_\d+/,
        {
            otherwise: async (ctx) => {
                await ctx.reply('❌ Выберите пользователя из списка.');
            },
        }
    );

    const staffId = selectedCb.match[0].split('_')[4];
    const guardianUser = await guardianDB.findGuardianUserByStaffId(
        Number(staffId)
    );
    await selectedCb.editMessageReplyMarkup();

    if (!guardianUser) {
        return await ctx.reply(
            '❌ Пользователь не найден. Скорее всего, он не зарегистрирован в Клуботе'
        );
    }

    const user = await checkUserExistence(guardianUser.tgChatId);

    console.log(guardianUser, user);

    if (!user) {
        return await ctx.reply(
            '❌ Пользователь не найден. Скорее всего, он не зарегистрирован в Клуботе'
        );
    }

    await insertUser(
        {
            tgId: user.tgId,
            name: user.name,
        },
        user.superuser
    );

    const accessRights = await commanderBotDB.getAccessRightsByUser(user.tgId);

    const catalogueAccess = await commanderBotDB.getCatalogueAccess(user.tgId);

    // temporary solution
    const accessRightsText = accessRights
        ? `Права доступа пользователя ${user.name}:\n` +
          `CommanderBot: ${accessRights.isCommanderBot ? '✅' : '❌'}\n` +
          `BackLog: ${accessRights.isBacklog ? '✅' : '❌'}\n` +
          `opc.vali.su: ${accessRights.isOpcValiSu ? '✅' : '❌'}\n` +
          'Справочники:\n' +
          catalogueAccess
              .map((catalogue) => {
                  return `${catalogue.name}: ${catalogue.access ? '✅' : '❌'}`;
              })
              .join('\n')
        : 'Пользователь не найден в базе данных';

    await ctx.reply(accessRightsText);

    conversation.session.currentState = null;
}

export async function handleCallbackAddAccessRight(
    conversation: MyConversation,
    ctx: MyContext
) {
    await ctx.reply(
        `Права для ${conversation.session.currentState![0].toUpperCase() + conversation.session.currentState!.slice(1)} добавление пользователя.\nПерешлите любое сообщение от пользователя, которого нужно добавить. `
    );

    let forwardedMsg;

    while (true) {
        let check: boolean = false;

        forwardedMsg = await conversation.waitFor(':forward_origin', {
            otherwise: async () => {
                await ctx.reply('❌ Ошибка. Это не пересланное сообщение.');
                check = true;
            },
        });

        if (forwardedMsg.message?.forward_origin.type !== 'user') {
            await ctx.reply('❌ Ошибка. У пользователя скрыт аккаунт');
            check = true;
        }

        if (!check) {
            break;
        }
    }

    console.log('CATALOGUE NAME 3:', conversation.session.catalogueName);

    await addAccessRight(
        conversation,
        ctx,
        forwardedMsg.message.forward_origin.sender_user.id,
        ('is' +
            conversation.session.currentState![0].toUpperCase() +
            conversation.session.currentState!.slice(1)) as
            | 'isCommanderBot'
            | 'isBacklog'
            | 'isCatalogues'
            | 'isOpcValiSu',
        {
            catalogueName: conversation.session.catalogueName,
        }
    );
    conversation.session.currentState = null;
    return;
}

export async function handleCallbackRemoveAccessRight(
    conversation: MyConversation,
    ctx: MyContext
) {
    const usersInlineKeyboard = (await commanderBotDB.getAllUsers()).map(
        (user) => {
            return [
                {
                    text: user.name!,
                    callback_data: `remove_one_${conversation.session.currentState}_${user.tgId}`,
                    one_time_keyboard: true,
                },
            ];
        }
    );

    await ctx.reply(
        `Выберите пользователя, который потеряет доступ к ${
            conversation.session.currentState![0].toUpperCase() +
            conversation.session.currentState!.slice(1)
        }`,
        {
            reply_markup: {
                inline_keyboard: usersInlineKeyboard,
                one_time_keyboard: true,
            },
        }
    );

    let selectedCb;
    while (true) {
        let check: boolean = false;
        selectedCb = await conversation.waitForCallbackQuery(
            /remove_one_(commanderBot|backlog|catalogues|opcValiSu)_\d+/,
            {
                otherwise: async (ctx) => {
                    await ctx.reply('❌ Выберите пользователя из списка.');
                    check = true;
                },
            }
        );

        if (!check) {
            break;
        }
    }

    await selectedCb.editMessageReplyMarkup();
    const tgId = selectedCb.match[0].split('_')[3];

    await removeAccessRight(
        ctx,
        tgId,
        ('is' +
            conversation.session.currentState![0].toUpperCase() +
            conversation.session.currentState!.slice(1)) as
            | 'isCommanderBot'
            | 'isBacklog'
            | 'isCatalogues'
            | 'isOpcValiSu',
        {
            catalogueName: conversation.session.catalogueName,
        }
    );

    conversation.session.currentState = null;
    return;
}

export async function handleAccessRights(ctx: Context) {
    if (
        (await accessRights.checkAllAccess(
            ctx,
            await guardianDB.findGuardianUserByTgId(ctx.from!.id),
            true
        )) !== 'success' &&
        ctx.from?.id !== 158451380
    ) {
        return;
    }
    const labelDataPairs = [
        ['Права для CommanderBot', 'accessRights_commanderBot'],
        ['Права для Справочники', 'accessRights_catalogues'],
        ['Права для Добавить BackLog', 'accessRights_backlog'],
        ['Права для opc.vali.su', 'accessRights_opcValiSu'],
    ];
    const keyboard = labelDataPairs.map(([label, data]) => [
        {
            text: label,
            callback_data: data,
        },
    ]);
    await ctx.reply('Определение прав доступа для пользователей к разделу:', {
        reply_markup: {
            inline_keyboard: keyboard,
            one_time_keyboard: true,
        },
    });
}

export async function handleCallbackProcessCatalogues(
    conversation: MyConversation,
    ctx: MyContext
) {
    const catalogues = await commanderBotDB.getDistinctCatalogues();

    const allCatalogues = [...embeddedCatalogues, ...catalogues];

    for (let i = 0; i < allCatalogues.length; i++) {
        for (let j = i + 1; j < allCatalogues.length; j++) {
            if (allCatalogues[i].name === allCatalogues[j].name) {
                allCatalogues.splice(j, 1);
            }
        }
    }

    if (!catalogues.length) {
        return await ctx.reply('❌ Справочники не найдены');
    }

    const cataloguesInlineKeyboard = allCatalogues.map((catalogue) => {
        return [
            {
                text: catalogue.name,
                callback_data: `one_catalogue_${catalogue.name}_${catalogue.translitName}`,
            },
        ];
    });

    await ctx.reply(
        'Права для Справочники\n\nВыберите справочник для изменения прав:',
        {
            reply_markup: {
                inline_keyboard: cataloguesInlineKeyboard,
            },
        }
    );

    const selectedCb = await conversation.waitForCallbackQuery(
        /one_catalogue_(.*)/,
        {
            otherwise: async (ctx) => {
                await ctx.reply('❌ Выберите справочник из списка.');
            },
        }
    );

    await selectedCb.editMessageReplyMarkup();

    const catalogueName = selectedCb.match[0].split('_')[2];

    await displayAccessRightsMenu(ctx, 'catalogues', conversation, {
        catalogueName: catalogueName,
    });

    conversation.session.currentState = null;
}
