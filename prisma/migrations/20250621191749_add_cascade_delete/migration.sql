-- DropForeignKey
ALTER TABLE "DownloadUrl" DROP CONSTRAINT "DownloadUrl_orderId_fkey";

-- AlterTable
ALTER TABLE "_ModuleToRole" ADD CONSTRAINT "_ModuleToRole_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ModuleToRole_AB_unique";

-- AddForeignKey
ALTER TABLE "DownloadUrl" ADD CONSTRAINT "DownloadUrl_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
