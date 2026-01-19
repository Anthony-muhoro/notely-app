import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, FileText, MessageSquare, FileText as FileTextIcon, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PDFViewer from "@/components/pdf/PDFViewer";
import ChatInterface from "@/components/pdf/ChatInterface";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import { useToast } from "@/hooks/use-toast";
import ApiClient from "@/lib/api";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/store/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const PDFChat = () => {
  useScrollToTop();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPdf, setShowPdf] = useState(true);
  const [showChat, setShowChat] = useState(true);

  // Fetch PDF and chat history
  const {
    data: pdfData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["pdf", id],
    queryFn: async () => {
      const response = await ApiClient.get(`/pdfs/${id}`);
      console.log("PDF Data received:", response.data.data);
      console.log("PDF URL:", response.data.data?.fileUrl);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Load chat history
  useEffect(() => {
    if (pdfData && pdfData.chatSessions && pdfData.chatSessions.length > 0) {
      const session = pdfData.chatSessions[0];
      const historyMessages: Message[] = session.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.dateCreated),
      }));
      setMessages(historyMessages);
    }
  }, [pdfData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await ApiClient.post("/pdfs/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "PDF uploaded successfully",
        description: "Your PDF is being processed...",
      });

      // Navigate to the new PDF chat page
      navigate(`/pdf-chat/${response.data.data.pdf.id}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMessageAdded = async (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  if (!id) {
    // No PDF selected - show upload interface
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12">
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              PDF Chat Assistant
            </h1>
            <p className="text-gray-600 mb-8">
              Upload a PDF document to start an AI-powered conversation about its
              content
            </p>
            <div className="flex flex-col items-center gap-4">
              <label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  asChild
                  size="lg"
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Upload PDF
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-sm text-gray-500">
                Maximum file size: 50MB
              </p>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !pdfData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              PDF not found
            </h1>
            <p className="text-gray-600 mb-6">
              The PDF you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/pdf-chat")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pdf-chat")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {pdfData.fileName}
              </h1>
              <p className="text-sm text-gray-500">
                {pdfData.pageCount} pages •{" "}
                {(pdfData.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Buttons */}
            <Button
              variant={showPdf ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowPdf(!showPdf);
                if (!showPdf && !showChat) setShowChat(true);
              }}
              title={showPdf ? "Hide PDF" : "Show PDF"}
            >
              {showPdf ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              PDF
            </Button>
            <Button
              variant={showChat ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowChat(!showChat);
                if (!showPdf && !showChat) setShowPdf(true);
              }}
              title={showChat ? "Hide Chat" : "Show Chat"}
            >
              {showChat ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/pdf";
                input.onchange = (e) => {
                  handleFileUpload(e as any);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New PDF
            </Button>
          </div>
        </div>

        {/* Split Layout: PDF Viewer and Chat */}
        <div className={`flex-1 gap-4 p-4 overflow-hidden min-h-0 ${
          showPdf && showChat 
            ? "grid grid-cols-1 lg:grid-cols-2" 
            : "flex"
        }`}>
          {/* PDF Viewer - Left Side */}
          {showPdf && (
            <div className={`h-full min-h-0 overflow-hidden ${
              showChat ? "" : "w-full"
            }`}>
              <PDFViewer fileUrl={pdfData.fileUrl} fileName={pdfData.fileName} />
            </div>
          )}

          {/* Chat Interface - Right Side */}
          {showChat && (
            <div className={`h-full min-h-0 overflow-hidden flex flex-col ${
              showPdf ? "" : "w-full"
            }`}>
              <ChatInterface
                pdfId={id}
                initialMessages={messages}
                onMessageAdded={handleMessageAdded}
              />
            </div>
          )}
        </div>
        
        {/* VAPI Voice Assistant - Fixed Position */}
        {pdfData.extractedText && (
          <VoiceAssistant
            assistantType="pdf"
            pdfData={{
              fileName: pdfData.fileName,
              content: pdfData.extractedText,
              pageCount: pdfData.pageCount,
              imageUrls: pdfData.imageUrls || [],
              imageAnalysis: pdfData.imageAnalysis || null,
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PDFChat;
