-- CreateTable
CREATE TABLE "VerifiedUsers" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(280) NOT NULL,
    "phoneNumber" VARCHAR(12),
    "emailId" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "hashedOTP" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VerifiedUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedUsers_userId_key" ON "VerifiedUsers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedUsers_phoneNumber_key" ON "VerifiedUsers"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedUsers_emailId_key" ON "VerifiedUsers"("emailId");
