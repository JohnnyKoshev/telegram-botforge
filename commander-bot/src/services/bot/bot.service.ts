import { Context } from 'grammy';
import { goToMainMenu } from '../../../../shared-lib/mainMenu';

export async function handleMainMenu(ctx: Context) {
    return await goToMainMenu(ctx);
}
