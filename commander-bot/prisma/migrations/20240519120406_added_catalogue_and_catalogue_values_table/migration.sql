-- CreateTable
CREATE TABLE `Catalogue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `access` BOOLEAN NOT NULL DEFAULT false,
    `userTgId` INTEGER NOT NULL,

    UNIQUE INDEX `Catalogue_userTgId_name_key`(`userTgId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CatalogueValue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(191) NOT NULL,
    `catalogueId` INTEGER NOT NULL,

    UNIQUE INDEX `CatalogueValue_catalogueId_value_key`(`catalogueId`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Catalogue` ADD CONSTRAINT `Catalogue_userTgId_fkey` FOREIGN KEY (`userTgId`) REFERENCES `User`(`tgId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CatalogueValue` ADD CONSTRAINT `CatalogueValue_catalogueId_fkey` FOREIGN KEY (`catalogueId`) REFERENCES `Catalogue`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
