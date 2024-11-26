export async function handleGeneralizedHelp(
    conversation,
    ctx,
    sendMessage,
) {
    ctx.reply('🍿 Хотите сообщить об ошибке?  Или у вас есть предложение как можно улучшить работу бота?\n' +
        '\nНапишите ваш запрос и отправьте мне, я перешлю его разработчикам:\n');

    const helpText = await conversation.waitFor('message', {
        otherwise: async (ctx) => {
            await ctx.reply('Пожалуйста, отправьте текст');
        },
    });

    if (!helpText.message.text) {
        await ctx.reply('Пожалуйста, отправьте текст');
        return false;
    }

    try {
        await sendMessage(helpText.message.text, {
            chatId: ctx.from.id,
            username: ctx.from.username ?? '',
        });
    } catch (e) {
        await ctx.reply('❌ Ошибка при отправке сообщения');
        console.error(e);
        return false;
    }

    ctx.reply('✅ Спасибо, ваше сообщение отправлено и с вами вскоре свяжутся.');
    return true;
}


export function processError(botName, message, context, stack) {
    return `⭕ В работе ${botName} ошибка ${message}.\nКонтекст:\n${context}\nСтек:\n${stack}\n`;
}