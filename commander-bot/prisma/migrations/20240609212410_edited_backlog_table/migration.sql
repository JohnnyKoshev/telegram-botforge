/*
  Warnings:

  - You are about to drop the column `time` on the `backlog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Backlog` DROP COLUMN `time`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
