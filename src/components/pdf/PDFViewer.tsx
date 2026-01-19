import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card } from "@/components/ui/card";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker - use unpkg CDN (more reliable)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const PDFViewer = ({ fileUrl, fileName }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber] = useState<number>(1);
  const [scale] = useState<number>(1.0);
  const [rotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState<boolean>(false);

  // Debug: Log fileUrl when it changes
  useEffect(() => {
    console.log("PDFViewer - fileUrl:", fileUrl);
    console.log("PDFViewer - fileName:", fileName);
    if (fileUrl) {
      setLoading(true);
      setError(null);
      setNumPages(0);
    }
  }, [fileUrl, fileName]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    console.error("PDF URL:", fileUrl);
    console.error("Trying fallback iframe method...");
    setError(`Failed to load PDF: ${error.message || "Unknown error"}`);
    setLoading(false);
    // Try fallback after a delay
    setTimeout(() => {
      setUseFallback(true);
    }, 2000);
  }, [fileUrl]);


  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* PDF Content */}
      <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-100 p-4 flex justify-center items-start min-h-0">
        {!fileUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No PDF URL provided</p>
            </div>
          </div>
        ) : useFallback ? (
          <div className="w-full h-full">
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title={fileName}
            />
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              httpHeaders: {},
              withCredentials: false,
            }}
            loading={
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="text-center text-red-600 p-8">
                <p className="font-semibold mb-2">Failed to load PDF document</p>
                <p className="text-xs mt-2 text-gray-500 break-all max-w-md">{fileUrl}</p>
                <p className="text-xs mt-2">Check browser console for details</p>
                {error && <p className="text-xs mt-2 text-red-500">{error}</p>}
              </div>
            }
          >
            <div className="flex justify-center items-center">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg bg-white"
              />
            </div>
          </Document>
        )}
      </div>

      {/* File Info */}
      <div className="border-t border-gray-200 bg-gray-50 p-2">
        <p className="text-xs text-gray-600 truncate" title={fileName}>
          {fileName}
        </p>
      </div>
    </Card>
  );
};

export default PDFViewer;
