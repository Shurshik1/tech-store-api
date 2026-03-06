/*
  Warnings:

  - You are about to drop the column `availability` on the `Product` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "availability",
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'IN_STOCK';
