-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "coachId" TEXT;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
