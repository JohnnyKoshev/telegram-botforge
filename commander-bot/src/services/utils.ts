import { getUserByStaffId } from '../db/alisaDB';
import { findGuardianUserByTgId } from '../db/guardianDB';

export async function checkUserExistence(userTgId: number) {
    const guardianUser = await findGuardianUserByTgId(userTgId);

    if (!guardianUser) {
        return null;
    }

    const alisaUser = await getUserByStaffId(guardianUser.staffID);

    if (!alisaUser) {
        return null;
    }

    return {
        tgId: guardianUser.tgChatId,
        name: alisaUser.name,
        superuser: guardianUser.tgBotsCommanderSuperAdmin ?? false,
    };
}
