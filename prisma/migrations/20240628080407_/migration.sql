/*
  Warnings:

  - You are about to drop the column `AdvPriority` on the `Advertisement` table. All the data in the column will be lost.
  - You are about to drop the column `AdvSourceUrl` on the `Advertisement` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `DashboardUser` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Documents` table. All the data in the column will be lost.
  - You are about to drop the column `facName` on the `Facility` table. All the data in the column will be lost.
  - The `accessType` column on the `Familylinks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `dependantId` on the `HealthRecord` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `HealthRecord` table. All the data in the column will be lost.
  - You are about to drop the column `isSensitive` on the `Medicine` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Medicine` table. All the data in the column will be lost.
  - You are about to drop the column `isLoggedIn` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `vidDescription` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the `SyncChnages` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[currentSessionId]` on the table `DashboardUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facPhoneNumber]` on the table `Facility` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[forDependantId]` on the table `HealthRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[forUserId]` on the table `HealthRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,createdBy]` on the table `OtpStore` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[currentSessionId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `advName` to the `Advertisement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `advSourceUrl` to the `Advertisement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Advertisement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `DashboardUser` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `Dependant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `uploadedBy` to the `Documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facPrimaryName` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkType` to the `Familylinks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Medicine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verifiedContactId` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `Users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `country` to the `VerifiedUsers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vidName` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('complaint', 'feedback');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('minor', 'subaccount', 'existing');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('view', 'manage');

-- CreateEnum
CREATE TYPE "verifiedContactId" AS ENUM ('phoneNumber', 'emailId');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "Changes" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Documents" DROP CONSTRAINT "Documents_userId_fkey";

-- DropForeignKey
ALTER TABLE "HealthRecord" DROP CONSTRAINT "HealthRecord_dependantId_fkey";

-- DropForeignKey
ALTER TABLE "HealthRecord" DROP CONSTRAINT "HealthRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "Medicine" DROP CONSTRAINT "Medicine_userId_fkey";

-- DropIndex
DROP INDEX "HealthRecord_dependantId_key";

-- DropIndex
DROP INDEX "HealthRecord_userId_key";

-- DropIndex
DROP INDEX "OtpStore_emailId_key";

-- DropIndex
DROP INDEX "OtpStore_phoneNumber_key";

-- DropIndex
DROP INDEX "OtpStore_userId_key";

-- AlterTable
ALTER TABLE "Advertisement" DROP COLUMN "AdvPriority",
DROP COLUMN "AdvSourceUrl",
ADD COLUMN     "advName" VARCHAR(2048) NOT NULL,
ADD COLUMN     "advRedirectLink" TEXT,
ADD COLUMN     "advSourceUrl" TEXT NOT NULL,
ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'self',
ADD COLUMN     "forDependantId" TEXT,
ADD COLUMN     "forUserId" TEXT;

-- AlterTable
ALTER TABLE "DashboardUser" DROP COLUMN "password",
ADD COLUMN     "currentSessionId" TEXT,
ADD COLUMN     "position" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Dependant" ADD COLUMN     "emailId" TEXT,
ALTER COLUMN "phoneNumber" DROP NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "Documents" DROP COLUMN "userId",
ADD COLUMN     "forDependantId" TEXT,
ADD COLUMN     "forUserId" TEXT,
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Facility" DROP COLUMN "facName",
ADD COLUMN     "facPrimaryName" VARCHAR(2048) NOT NULL,
ADD COLUMN     "facSecondaryName" VARCHAR(2048),
ADD COLUMN     "updatedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Familylinks" ADD COLUMN     "linkType" "LinkType" NOT NULL,
ADD COLUMN     "sensitiveDataAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "synced" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "accessType",
ADD COLUMN     "accessType" "AccessType" NOT NULL DEFAULT 'view';

-- AlterTable
ALTER TABLE "HealthRecord" DROP COLUMN "dependantId",
DROP COLUMN "userId",
ADD COLUMN     "forDependantId" TEXT,
ADD COLUMN     "forUserId" TEXT;

-- AlterTable
ALTER TABLE "Medicine" DROP COLUMN "isSensitive",
DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "forDependantId" TEXT,
ADD COLUMN     "forUserId" TEXT;

-- AlterTable
ALTER TABLE "OtpStore" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'self',
ALTER COLUMN "phoneNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "isLoggedIn",
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "currentSessionId" TEXT,
ADD COLUMN     "isMigrated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedContactId" "verifiedContactId" NOT NULL,
ALTER COLUMN "phoneNumber" DROP NOT NULL,
ALTER COLUMN "emailId" DROP NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "VerifiedUsers" ADD COLUMN     "country" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "vidDescription",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedBy" TEXT NOT NULL,
ADD COLUMN     "vidName" VARCHAR(2048) NOT NULL,
ADD COLUMN     "vidTags" TEXT[];

-- DropTable
DROP TABLE "SyncChnages";

-- CreateTable
CREATE TABLE "Notes" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Color" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "forDependantId" TEXT,
    "forUserId" TEXT,

    CONSTRAINT "Notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncChanges" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "userChanged" TEXT NOT NULL,
    "changeType" "Changes" NOT NULL,
    "recordId" INTEGER NOT NULL,
    "table" TEXT NOT NULL,
    "familyMember" TEXT NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SyncChanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalModule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vitalName" TEXT NOT NULL,
    "vitalCode" TEXT NOT NULL,
    "vitalDataStructure" JSONB[],
    "filters" JSONB[],
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "VitalModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalsUserData" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vitalRecordData" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'self',
    "recordedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vitalCodeId" TEXT NOT NULL,
    "forDependantId" TEXT,
    "forUserId" TEXT,

    CONSTRAINT "VitalsUserData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMessage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply" TEXT,
    "replyBy" TEXT,
    "messageType" "MessageType" NOT NULL,
    "userId" TEXT,

    CONSTRAINT "UserMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockReasons" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "blockReason" TEXT NOT NULL,
    "blockedBy" TEXT NOT NULL DEFAULT 'auto-block',

    CONSTRAINT "BlockReasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardUserOtpStore" (
    "id" SERIAL NOT NULL,
    "hashedOTP" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" VARCHAR(280) NOT NULL,
    "position" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "DashboardUserOtpStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VitalModule_vitalName_key" ON "VitalModule"("vitalName");

-- CreateIndex
CREATE UNIQUE INDEX "VitalModule_vitalCode_key" ON "VitalModule"("vitalCode");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardUserOtpStore_emailId_key" ON "DashboardUserOtpStore"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardUser_currentSessionId_key" ON "DashboardUser"("currentSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_facPhoneNumber_key" ON "Facility"("facPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRecord_forDependantId_key" ON "HealthRecord"("forDependantId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRecord_forUserId_key" ON "HealthRecord"("forUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpStore_userId_createdBy_key" ON "OtpStore"("userId", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Users_currentSessionId_key" ON "Users"("currentSessionId");

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_forDependantId_fkey" FOREIGN KEY ("forDependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_forDependantId_fkey" FOREIGN KEY ("forDependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_forDependantId_fkey" FOREIGN KEY ("forDependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_forDependantId_fkey" FOREIGN KEY ("forDependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_forDependantId_fkey" FOREIGN KEY ("forDependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "DashboardUser"("emailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "DashboardUser"("emailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "DashboardUser"("emailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalModule" ADD CONSTRAINT "VitalModule_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "DashboardUser"("emailId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsUserData" ADD CONSTRAINT "VitalsUserData_forDependantId_fkey" FOREIGN KEY ("forDependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsUserData" ADD CONSTRAINT "VitalsUserData_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalsUserData" ADD CONSTRAINT "VitalsUserData_vitalCodeId_fkey" FOREIGN KEY ("vitalCodeId") REFERENCES "VitalModule"("vitalCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_replyBy_fkey" FOREIGN KEY ("replyBy") REFERENCES "DashboardUser"("emailId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockReasons" ADD CONSTRAINT "BlockReasons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
