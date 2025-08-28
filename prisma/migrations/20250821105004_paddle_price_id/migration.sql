-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "paddlePriceId" TEXT,
ADD COLUMN     "paddleProductId" TEXT;

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "paddlePriceId" TEXT;
