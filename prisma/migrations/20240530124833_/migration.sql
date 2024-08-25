-- AlterTable
ALTER TABLE "Documents" ALTER COLUMN "DocumentConsultant" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Medicine" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "medName" VARCHAR(280) NOT NULL,
    "medUnit" TEXT NOT NULL DEFAULT 'tablet',
    "medInventory" INTEGER NOT NULL,
    "medDoctor" TEXT,
    "medIntakeTime" TEXT NOT NULL,
    "medIntakePerDose" INTEGER NOT NULL,
    "medIntakeFrequency" TEXT NOT NULL,
    "medReminderFrequency" TEXT,
    "medDosage" INTEGER DEFAULT 1,
    "MedDosageSchedule" TIMESTAMP(3)[],
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRefill" BOOLEAN NOT NULL DEFAULT false,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
