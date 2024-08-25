-- CreateTable
CREATE TABLE "loginOtpStore" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" VARCHAR(12),
    "hashedOTP" TEXT NOT NULL,

    CONSTRAINT "loginOtpStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loginOtpStore_userId_key" ON "loginOtpStore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "loginOtpStore_phoneNumber_key" ON "loginOtpStore"("phoneNumber");
