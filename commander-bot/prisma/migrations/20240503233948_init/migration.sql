-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tgId` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,

    UNIQUE INDEX `User_tgId_key`(`tgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessRight` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userTgId` INTEGER NOT NULL,
    `isCommanderBot` BOOLEAN NOT NULL DEFAULT false,
    `isBacklog` BOOLEAN NOT NULL DEFAULT false,
    `isOpcValiSu` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `AccessRight_userTgId_key`(`userTgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccessRight` ADD CONSTRAINT `AccessRight_userTgId_fkey` FOREIGN KEY (`userTgId`) REFERENCES `User`(`tgId`) ON DELETE CASCADE ON UPDATE CASCADE;
