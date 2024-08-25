-- DropForeignKey
ALTER TABLE "HealthRecord" DROP CONSTRAINT "HealthRecord_dependantId_fkey";

-- DropForeignKey
ALTER TABLE "HealthRecord" DROP CONSTRAINT "HealthRecord_userId_fkey";

-- AlterTable
ALTER TABLE "HealthRecord" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "dependantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "dob" SET DATA TYPE DATE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "Dependant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
