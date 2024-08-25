/*
  Warnings:

  - You are about to drop the `loginOtpStore` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "loginOtpStore";

-- CreateTable
CREATE TABLE "OtpStore" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" VARCHAR(12),
    "hashedOTP" TEXT NOT NULL,

    CONSTRAINT "OtpStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OtpStore_userId_key" ON "OtpStore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpStore_phoneNumber_key" ON "OtpStore"("phoneNumber");
