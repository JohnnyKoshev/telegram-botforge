import { MyContext, MyConversation } from '../../bot';
import { handleGeneralizedHelp } from '../../../../shared-lib/utils';
import * as guardianDB from '../../db/guardianDB';

export async function handleHelp(ctx: MyContext) {
    await ctx.conversation.enter('processHelp');
}

export async function processHelp(
    conversation: MyConversation,
    ctx: MyContext
) {
    await handleGeneralizedHelp(
        conversation,
        ctx,
        async (
            message: string | null,
            details: {
                chatId: number;
                username: string;
            }
        ) => {
            if (!message) throw new Error('Message is empty');
            const modifiedMessage = `Получено сообщение об ошибке или с предложением:\n\n${message}\n\nОтправитель:\n${details.chatId}\n${details.username ? '@' + details.username : ''}`;
            const superAdmins = await guardianDB.findSuperAdmins();
            for (const admin of superAdmins) {
                await ctx.api.sendMessage(admin.tgChatId, modifiedMessage);
            }
        }
    );
}
