-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "price" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION,
    "discountPrice" DOUBLE PRECISION,
    "mockups" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);
