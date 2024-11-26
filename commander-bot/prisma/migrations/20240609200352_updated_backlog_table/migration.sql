/*
  Warnings:

  - Added the required column `creatorTgId` to the `Backlog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Backlog` ADD COLUMN `creatorTgId` INTEGER NOT NULL,
    MODIFY `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
