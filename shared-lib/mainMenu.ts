export async function goToMainMenu(ctx) {
    try {
        await ctx.conversation.exit();
    } catch (e) {
        return;
    } finally {
        await ctx.reply('✔️ Я забыл все данные и перешел в главное меню.\n' +
            'Если в вашем меню только эта команда – обратитесь к офис-менеджеру.');
    }
}