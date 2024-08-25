-- CreateTable
CREATE TABLE "ActiveUsers" (
    "id" TEXT NOT NULL,
    "timeStamp" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveUsers_id_key" ON "ActiveUsers"("id");

-- AddForeignKey
ALTER TABLE "ActiveUsers" ADD CONSTRAINT "ActiveUsers_id_fkey" FOREIGN KEY ("id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
