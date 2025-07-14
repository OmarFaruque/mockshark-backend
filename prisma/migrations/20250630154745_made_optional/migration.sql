-- DropForeignKey
ALTER TABLE "DownloadUrl" DROP CONSTRAINT "DownloadUrl_productId_fkey";

-- DropForeignKey
ALTER TABLE "DownloadUrl" DROP CONSTRAINT "DownloadUrl_userId_fkey";

-- AlterTable
ALTER TABLE "DownloadUrl" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "orderId" DROP NOT NULL,
ALTER COLUMN "downloadUrl" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DownloadUrl" ADD CONSTRAINT "DownloadUrl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadUrl" ADD CONSTRAINT "DownloadUrl_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
