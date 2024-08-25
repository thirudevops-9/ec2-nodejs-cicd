/*
  Warnings:

  - Added the required column `apptDate` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apptTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "apptDate" DATE NOT NULL,
ADD COLUMN     "apptTime" TIMESTAMP NOT NULL;
