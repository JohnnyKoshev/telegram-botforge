/*
  Warnings:

  - A unique constraint covering the columns `[userTgId,name,translitName]` on the table `Catalogue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `translitName` to the `Catalogue` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE `Catalogue` ADD COLUMN `translitName` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Catalogue_userTgId_name_translitName_key` ON `Catalogue`(`userTgId`, `name`, `translitName`);
