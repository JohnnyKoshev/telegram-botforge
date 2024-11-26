type UserSettings = {
    userFound?: boolean | null,
    userActive?: boolean | null,
    userSU?: boolean | null,
};

export function checkAccessRights(userSettings: UserSettings) {
    if (userSettings.userFound !== null && !userSettings.userFound) {
        return '❓Вы не зарегистрированы. Пройдите регистрацию в Клуботе @This_is_Alisa_bot';
    } else if (userSettings.userActive !== null && !userSettings.userActive) {
        return '⏸Ваш аккаунт деактивирован. Обратитесь к офис-менеджеру.';
    } else if (userSettings.userSU !== null && !userSettings.userSU) {
        return '🔒У вас нет доступа к этой команде. Обратитесь к администратору.';
    }
    return 'success';
}

async function processAccessRights(ctx, userSettings: UserSettings) {
    const processRightsResult = checkAccessRights(userSettings);
    if (processRightsResult !== 'success') {
        return await ctx.reply(processRightsResult);
    }
    return 'success';
}

export async function checkAllAccess(ctx, guardianUser, forSU: boolean) {
    return await processAccessRights(ctx, {
        userFound: !!guardianUser,
        userActive: !!guardianUser?.isUserActive,
        userSU: forSU ? !!guardianUser?.tgBotsCommanderSuperAdmin : null,
    });
}
