-- AlterTable
ALTER TABLE "athletes" ADD COLUMN     "profilePicture" TEXT;

-- AlterTable
ALTER TABLE "coaches" ADD COLUMN     "profilePicture" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedBy" TEXT,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;
