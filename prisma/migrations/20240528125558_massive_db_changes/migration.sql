/*
  Warnings:

  - You are about to drop the `Bill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OtherDocuments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Prescription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_userId_fkey";

-- DropForeignKey
ALTER TABLE "Dependant" DROP CONSTRAINT "Dependant_userId_fkey";

-- DropForeignKey
ALTER TABLE "HealthRecord" DROP CONSTRAINT "HealthRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "OtherDocuments" DROP CONSTRAINT "OtherDocuments_userId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_userId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "OtpStore" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VerifiedUsers" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Bill";

-- DropTable
DROP TABLE "OtherDocuments";

-- DropTable
DROP TABLE "Prescription";

-- DropTable
DROP TABLE "Report";

-- CreateTable
CREATE TABLE "Documents" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "DocumentImage" TEXT NOT NULL,
    "DocumentName" VARCHAR(280) NOT NULL,
    "DocumentCategory" VARCHAR(280) NOT NULL,
    "DocumentConsultant" VARCHAR(280) NOT NULL,
    "notes" VARCHAR(2048),
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependant" ADD CONSTRAINT "Dependant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
