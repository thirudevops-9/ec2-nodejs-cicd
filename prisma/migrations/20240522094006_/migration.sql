/*
  Warnings:

  - A unique constraint covering the columns `[emailId]` on the table `OtpStore` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OtpStore" ADD COLUMN     "emailId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OtpStore_emailId_key" ON "OtpStore"("emailId");
