/*
  Warnings:

  - You are about to drop the column `userId` on the `DashboardUser` table. All the data in the column will be lost.
  - You are about to drop the column `consent` on the `Dependant` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Dependant` table. All the data in the column will be lost.
  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `relation` to the `Familylinks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_userId_fkey";

-- DropIndex
DROP INDEX "DashboardUser_userId_key";

-- AlterTable
ALTER TABLE "DashboardUser" DROP COLUMN "userId",
ADD COLUMN     "refreshToken" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "Dependant" DROP COLUMN "consent",
DROP COLUMN "password",
ADD COLUMN     "declaration" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Familylinks" ADD COLUMN     "relation" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "subscription" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Reminder";
