-- CreateTable
CREATE TABLE "OTPStore" (
    "id" SERIAL NOT NULL,
    "otpMethod" TEXT NOT NULL,
    "otp" INTEGER NOT NULL,

    CONSTRAINT "OTPStore_pkey" PRIMARY KEY ("id")
);
