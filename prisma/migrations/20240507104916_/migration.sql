/*
  Warnings:

  - You are about to drop the column `otpMethod` on the `OTPStore` table. All the data in the column will be lost.
  - Added the required column `contact` to the `OTPStore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OTPStore" DROP COLUMN "otpMethod",
ADD COLUMN     "contact" TEXT NOT NULL;
