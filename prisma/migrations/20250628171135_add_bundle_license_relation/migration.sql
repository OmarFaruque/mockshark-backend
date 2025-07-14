-- AlterTable
ALTER TABLE "LicenseCertificate" ADD COLUMN     "bundleOrderId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "bundleOrderId" TEXT;

-- CreateTable
CREATE TABLE "BundleOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "billingFirstName" TEXT NOT NULL,
    "billingLastName" TEXT NOT NULL,
    "billingEmail" TEXT NOT NULL,
    "billingPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_bundleOrderId_fkey" FOREIGN KEY ("bundleOrderId") REFERENCES "BundleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCertificate" ADD CONSTRAINT "LicenseCertificate_bundleOrderId_fkey" FOREIGN KEY ("bundleOrderId") REFERENCES "BundleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleOrder" ADD CONSTRAINT "BundleOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
