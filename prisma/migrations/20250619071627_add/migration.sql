-- AlterTable
ALTER TABLE "DownloadUrl" ADD COLUMN     "downloadUrl" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "downloadUrl" TEXT;
