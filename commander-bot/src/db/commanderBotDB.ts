import {
    AccessRight,
    CatalogueValue,
    PrismaClient,
    User,
} from '@prisma/client';
import cyrillicToTranslit from 'cyrillic-to-translit-js';

const prisma = new PrismaClient();

export async function insertUser(user: Omit<User, 'id'>, superuser = false) {
    try {
        let foundUser = await prisma.user.findUnique({
            where: {
                tgId: user.tgId,
            },
        });

        if (foundUser) return;

        const createdUser = await prisma.user.create({
            data: user,
        });

        await prisma.accessRight.create({
            data: {
                userTgId: createdUser.tgId,
                isBacklog: superuser,
                isCommanderBot: superuser,
                isOpcValiSu: superuser,
            },
        });

        if (superuser) {
            await grantAccessToAllCatalogues(createdUser.tgId);
        }
    } catch (e) {
        throw new Error('Failed to insert user');
    }
}

export async function updateAccessRight(
    userTgId: number,
    accessRight: Omit<AccessRight, 'id' | 'userTgId'>
) {
    const user = await findUserByTgId(userTgId);
    if (!user) {
        throw new Error('User not found');
    }

    try {
        await prisma.accessRight.update({
            where: {
                userTgId,
            },
            data: accessRight,
        });
    } catch (e) {
        console.error(e);
        throw new Error('Failed to update access rights');
    }
    console.log('Access rights updated');
}

export async function updateCatalogueAccess(
    catalogue: string,
    userTgId: number,
    access = false
) {
    const user = await findUserByTgId(userTgId);
    if (!user) {
        throw new Error('User not found');
    }

    const foundCatalogue = await prisma.catalogue.findFirst({
        where: {
            name: catalogue,
            userTgId,
        },
    });

    if (!foundCatalogue) {
        await insertCatalogue({
            name: catalogue,
            translitName: cyrillicToTranslit().transform(catalogue, '_'),
            userTgId,
            access: true,
        });
    }

    try {
        await prisma.catalogue.updateMany({
            where: {
                name: catalogue,
                userTgId,
            },
            data: {
                access,
            },
        });
    } catch (e) {
        throw new Error('Failed to update access rights');
    }
}

export async function grantAccessToAllCatalogues(userTgId: number) {
    try {
        const allCatalogues = await getDistinctCatalogues();

        for (const catalogue of allCatalogues) {
            await insertCatalogue({
                name: catalogue.name,
                translitName: catalogue.translitName,
                userTgId,
                access: true,
            });
        }
    } catch (e) {
        throw new Error('Failed to update access rights');
    }
}

export async function getCatalogueAccess(userTgId: number) {
    try {
        return await prisma.catalogue.findMany({
            where: {
                userTgId,
            },
        });
    } catch (e) {
        throw new Error('Failed to retrieve catalogues');
    }
}

export async function insertCatalogue(catalogue: {
    name: string;
    translitName: string;
    userTgId: number;
    access?: boolean;
}) {
    try {
        let foundCatalogue = await prisma.user.findUnique({
            where: {
                tgId: catalogue.userTgId,
                name: catalogue.name,
            },
        });

        if (foundCatalogue) return;

        await prisma.catalogue.create({
            data: {
                name: catalogue.name,
                translitName: catalogue.translitName,
                access: catalogue.access ? catalogue.access : false,
                userTgId: catalogue.userTgId,
            },
        });
    } catch (e) {
        console.error(e);
        throw new Error('Failed to insert catalogue');
    }
}

export async function getDistinctCatalogues() {
    try {
        return await prisma.catalogue.findMany({
            distinct: ['name'],
        });
    } catch (e) {
        throw new Error('Failed to retrieve catalogues');
    }
}

export async function getCataloguesByUserWithAccess(userTgId: number) {
    try {
        return await prisma.catalogue.findMany({
            where: {
                userTgId,
                access: true,
            },
        });
    } catch (e) {
        throw new Error('Failed to retrieve catalogues');
    }
}

export async function getAccessRightsByUser(tgId: number) {
    return prisma.accessRight.findUnique({
        where: {
            userTgId: tgId,
        },
    });
}

export async function findUserByTgId(tgId: number) {
    return prisma.user.findUnique({
        where: {
            tgId,
        },
    });
}

export async function findCatalogue(catalogue: {
    translitName: string;
    userTgId: number;
}) {
    return prisma.catalogue.findFirst({
        where: {
            translitName: catalogue.translitName,
            userTgId: catalogue.userTgId,
        },
    });
}

export async function getAllCatalogueValues(catalogue: {
    translitName: string;
    userTgId: number;
}) {
    const catalogueRecords = await prisma.catalogue.findMany({
        where: {
            translitName: catalogue.translitName,
        },
    });

    if (!catalogueRecords.length) {
        throw new Error('Catalogue not found');
    }

    const distinctCatalogueValues: CatalogueValue[] = [];

    for (const catalogueRecord of catalogueRecords) {
        const catalogueValues = await prisma.catalogueValue.findMany({
            where: {
                catalogueId: catalogueRecord.id,
            },
        });

        for (const catalogueValue of catalogueValues) {
            if (
                !distinctCatalogueValues.find(
                    (v) => v.value === catalogueValue.value
                )
            ) {
                distinctCatalogueValues.push(catalogueValue);
            }
        }
    }

    return distinctCatalogueValues;
}

export async function addCatalogueValue(catalogue: {
    translitName: string;
    userTgId: number;
    value: string;
}) {
    const catalogueRecords = await prisma.catalogue.findMany({
        where: {
            translitName: catalogue.translitName,
        },
    });

    if (!catalogueRecords.length) {
        throw new Error('Catalogue not found');
    }

    for (const catalogueRecord of catalogueRecords) {
        await prisma.catalogueValue.create({
            data: {
                catalogueId: catalogueRecord.id,
                value: catalogue.value,
            },
        });
    }

    return;
}

export async function removeCatalogueValue(catalogue: {
    translitName: string;
    userTgId: number;
    value: string;
}) {
    const catalogueRecords = await prisma.catalogue.findMany({
        where: {
            translitName: catalogue.translitName,
        },
    });

    if (!catalogueRecords.length) {
        throw new Error('Catalogue not found');
    }

    for (const catalogueRecord of catalogueRecords) {
        await prisma.catalogueValue.deleteMany({
            where: {
                catalogueId: catalogueRecord.id,
                value: catalogue.value,
            },
        });
    }

    return;
}

export async function addBacklog(backlog: {
    name: string;
    creatorTgId: number;
    text: string;
}) {
    const user = await findUserByTgId(backlog.creatorTgId);
    if (!user) {
        throw new Error('User not found');
    }

    return prisma.backlog.create({
        data: {
            name: backlog.name,
            creatorTgId: backlog.creatorTgId,
            text: backlog.text,
        },
    });
}

export async function getBacklogsByName(name: string) {
    return prisma.backlog.findMany({
        where: {
            name,
        },
    });
}

export async function getAllUsers() {
    const users = await prisma.user.findMany();
    return users.sort((a, b) => ('' + a.name).localeCompare(b.name + ''));
}

export async function findCardNumber(discountCardNumberLine: string) {
    return prisma.discountCardNumber.findFirst({
        where: {
            discountCardNumberLine,
        },
    });
}

export async function createCardNumber(discountCardNumber: {
    discountCardNumberLine: string;
    discountCardNumberMin: number;
    discountCardNumberMax: number;
}) {
    return prisma.discountCardNumber.create({
        data: discountCardNumber,
    });
}

export async function updateCardNumber(
    id: number,
    discountCardNumber: {
        discountCardNumberMin?: number;
        discountCardNumberMax?: number;
    }
) {
    return prisma.discountCardNumber.update({
        where: {
            id,
        },
        data: discountCardNumber,
    });
}
