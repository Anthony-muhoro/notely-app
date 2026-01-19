-- AlterTable
ALTER TABLE "pdf_documents" ADD COLUMN     "imageAnalysis" TEXT,
ADD COLUMN     "imageAnalysisDate" TIMESTAMP(3),
ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
