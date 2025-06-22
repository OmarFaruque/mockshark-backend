-- CreateTable
CREATE TABLE "LicenseCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "productId" TEXT,
    "licenseType" TEXT NOT NULL,
    "licenseText" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseCertificate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LicenseCertificate" ADD CONSTRAINT "LicenseCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCertificate" ADD CONSTRAINT "LicenseCertificate_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseCertificate" ADD CONSTRAINT "LicenseCertificate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
