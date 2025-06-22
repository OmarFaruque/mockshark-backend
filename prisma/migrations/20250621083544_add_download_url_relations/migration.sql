/*
  Warnings:

  - Made the column `userId` on table `DownloadUrl` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `DownloadUrl` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderId` on table `DownloadUrl` required. This step will fail if there are existing NULL values in that column.
  - Made the column `downloadUrl` on table `DownloadUrl` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DownloadUrl" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "licenseText" TEXT,
ADD COLUMN     "licenseType" TEXT,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "orderId" SET NOT NULL,
ALTER COLUMN "downloadUrl" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DownloadUrl" ADD CONSTRAINT "DownloadUrl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadUrl" ADD CONSTRAINT "DownloadUrl_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadUrl" ADD CONSTRAINT "DownloadUrl_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
