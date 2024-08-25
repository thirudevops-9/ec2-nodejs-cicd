/*
  Warnings:

  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" VARCHAR(280) NOT NULL,
    "phoneNumber" VARCHAR(12) NOT NULL,
    "emailId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "address" VARCHAR(2048),
    "pincode" VARCHAR(10) NOT NULL,
    "emergencyContact" VARCHAR(12),
    "profileImage" TEXT,
    "QRCodeURL" TEXT,
    "isSync" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isLoggedIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "presentDiseases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "doctorFullName" VARCHAR(255),
    "docAddress" VARCHAR(2048),
    "docPhoneNumber" VARCHAR(12),
    "additionalInformation" VARCHAR(2048),
    "userId" TEXT NOT NULL,
    "dependantId" TEXT NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" VARCHAR(280) NOT NULL,
    "phoneNumber" VARCHAR(12) NOT NULL,
    "password" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "address" VARCHAR(2048),
    "pincode" VARCHAR(10) NOT NULL,
    "emergencyContact" VARCHAR(12),
    "profileImage" TEXT,
    "QRCodeURL" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isLoggedIn" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Dependant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billImage" TEXT NOT NULL,
    "billName" VARCHAR(280) NOT NULL,
    "billType" VARCHAR(280) NOT NULL,
    "billDoctorName" VARCHAR(280) NOT NULL,
    "notes" VARCHAR(2048),
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prescriptionImage" TEXT NOT NULL,
    "prescriptionName" VARCHAR(280) NOT NULL,
    "prescriptionDoctorName" VARCHAR(280) NOT NULL,
    "prescriptionClinic" VARCHAR(2048) NOT NULL,
    "notes" VARCHAR(2048),
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportImage" TEXT NOT NULL,
    "reportName" VARCHAR(280) NOT NULL,
    "reportDoctorName" VARCHAR(280) NOT NULL,
    "reportLab" VARCHAR(2048) NOT NULL,
    "notes" VARCHAR(2048),
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherDocuments" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "othersName" VARCHAR(280) NOT NULL,
    "othersDescription" VARCHAR(2048) NOT NULL,
    "notes" VARCHAR(2048),
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OtherDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "medicineName" VARCHAR(280) NOT NULL,
    "dosage" TEXT NOT NULL,
    "totalContents" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "doctorName" VARCHAR(280) NOT NULL,
    "description" VARCHAR(2048) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Familylinks" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkFrom" TEXT NOT NULL,
    "linkTo" TEXT NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'view',

    CONSTRAINT "Familylinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncChnages" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userChanged" TEXT NOT NULL,
    "userNotify" TEXT NOT NULL,
    "changedFileds" TEXT[],
    "table" TEXT NOT NULL,

    CONSTRAINT "SyncChnages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "facName" VARCHAR(2048) NOT NULL,
    "facPhoneNumber" VARCHAR(12) NOT NULL,
    "facAddress" VARCHAR(2048) NOT NULL,
    "facPincode" VARCHAR(10) NOT NULL,
    "facSpeciality" TEXT[] DEFAULT ARRAY['general']::TEXT[],
    "facType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardUser" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" VARCHAR(280) NOT NULL,
    "userId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" INTEGER NOT NULL,

    CONSTRAINT "DashboardUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vidSourceUrl" TEXT NOT NULL,
    "vidDescription" VARCHAR(2048) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "AdvSourceUrl" TEXT NOT NULL,
    "AdvPriority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_id_key" ON "Users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Users_phoneNumber_key" ON "Users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Users_emailId_key" ON "Users"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRecord_userId_key" ON "HealthRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthRecord_dependantId_key" ON "HealthRecord"("dependantId");

-- CreateIndex
CREATE UNIQUE INDEX "Dependant_id_key" ON "Dependant"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardUser_userId_key" ON "DashboardUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardUser_emailId_key" ON "DashboardUser"("emailId");

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "Dependant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependant" ADD CONSTRAINT "Dependant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherDocuments" ADD CONSTRAINT "OtherDocuments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
