-- CreateTable
CREATE TABLE "DownloadUrl" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "DownloadUrl_pkey" PRIMARY KEY ("id")
);
