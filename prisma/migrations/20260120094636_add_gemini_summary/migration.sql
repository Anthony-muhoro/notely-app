-- AlterTable
ALTER TABLE "pdf_documents" ADD COLUMN     "geminiSummary" TEXT,
ADD COLUMN     "geminiSummaryDate" TIMESTAMP(3);
