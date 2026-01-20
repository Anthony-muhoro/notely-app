import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, FileText, MessageSquare, FileText as FileTextIcon, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PDFViewer from "@/components/pdf/PDFViewer";
import ChatInterface from "@/components/pdf/ChatInterface";
import ChatHistorySidebar from "@/components/pdf/ChatHistorySidebar";
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
  const [showHistory, setShowHistory] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  // Fetch PDF and chat history
  // The PDF already includes geminiSummary from the database (generated during upload)
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
      console.log("Gemini Summary available:", !!response.data.data?.geminiSummary);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch all chat sessions
  const {
    data: chatSessions,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["pdf-chat-sessions", id],
    queryFn: async () => {
      const response = await ApiClient.get(`/pdfs/${id}/chat/sessions`);
      return response.data.data || [];
    },
    enabled: !!id,
    staleTime: 10000, // Cache for 10 seconds
  });

  // Load messages for current session using React Query
  const {
    data: sessionData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["pdf-chat-session", id, currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return null;
      const response = await ApiClient.get(`/pdfs/${id}/chat/sessions/${currentSessionId}`);
      return response.data.data;
    },
    enabled: !!id && !!currentSessionId,
    staleTime: 5000, // Cache for 5 seconds
  });

  // Update messages when session data changes
  useEffect(() => {
    if (sessionData && sessionData.messages) {
      const historyMessages: Message[] = sessionData.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.dateCreated),
      }));
      setMessages(historyMessages);
    } else if (!currentSessionId) {
      setMessages([]);
    }
  }, [sessionData, currentSessionId]);

  // Set initial session when sessions load (only if sessions have messages)
  useEffect(() => {
    if (chatSessions && chatSessions.length > 0 && !currentSessionId) {
      // Use the most recent session (all sessions returned have messages)
      const mostRecent = chatSessions[0];
      setCurrentSessionId(mostRecent.id);
    } else if (chatSessions && chatSessions.length === 0 && !currentSessionId) {
      // No sessions with messages - create a new one
      handleNewChat();
    }
  }, [chatSessions, currentSessionId]);

  const handleNewChat = async () => {
    try {
      // Clear messages immediately for instant UI feedback
      setMessages([]);
      
      const response = await ApiClient.post(`/pdfs/${id}/chat/sessions`);
      const newSession = response.data.data;
      
      // Set new session immediately
      setCurrentSessionId(newSession.id);
      
      // Invalidate queries to refresh both sidebar and session data
      queryClient.invalidateQueries({ queryKey: ["pdf-chat-sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["pdf-chat-session", id] });
      
      // Refetch sessions to update sidebar immediately
      await refetchSessions();
      
      toast({
        title: "New chat started",
        description: "You can now start a fresh conversation",
      });
    } catch (error: any) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    // Clear messages immediately for instant UI feedback
    setMessages([]);
    
    // Immediately set session ID for instant UI update
    setCurrentSessionId(sessionId);
    
    // Invalidate and refetch session messages to load content
    queryClient.invalidateQueries({ queryKey: ["pdf-chat-session", id, sessionId] });
    // Refetch will happen automatically via React Query
  };

  const handleFileUpload = async (file: File) => {
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
    
    // Invalidate session messages to ensure fresh data
    if (currentSessionId) {
      queryClient.invalidateQueries({ queryKey: ["pdf-chat-session", id, currentSessionId] });
      // Also invalidate sessions list to update message counts
      queryClient.invalidateQueries({ queryKey: ["pdf-chat-sessions", id] });
    }
  };

  // Fetch all PDFs when no ID is provided
  const {
    data: allPdfs,
    isLoading: isLoadingPdfs,
    refetch: refetchAllPdfs,
  } = useQuery({
    queryKey: ["all-pdfs"],
    queryFn: async () => {
      const response = await ApiClient.get("/pdfs");
      return response.data.data || [];
    },
    enabled: !id,
    staleTime: 30000,
  });

  // Fetch chat sessions for each PDF
  const {
    data: pdfsWithChats = [],
    isLoading: isLoadingChats,
  } = useQuery({
    queryKey: ["pdfs-with-chats", allPdfs?.map((p: any) => p.id).join(",")],
    queryFn: async () => {
      if (!allPdfs || allPdfs.length === 0) return [];
      
      // Fetch chat sessions for each PDF
      const pdfsWithSessions = await Promise.all(
        allPdfs.map(async (pdf: any) => {
          try {
            const sessionsResponse = await ApiClient.get(`/pdfs/${pdf.id}/chat/sessions`);
            const sessions = sessionsResponse.data.data || [];
            return {
              ...pdf,
              chatSessions: sessions,
              totalChats: sessions.length,
            };
          } catch (error) {
            console.error(`Error fetching sessions for PDF ${pdf.id}:`, error);
            return {
              ...pdf,
              chatSessions: [],
              totalChats: 0,
            };
          }
        })
      );
      
      // Only return PDFs that have chats
      return pdfsWithSessions.filter((pdf: any) => pdf.totalChats > 0);
    },
    enabled: !id && !!allPdfs && allPdfs.length > 0,
    staleTime: 10000,
  });

  if (!id) {
    // Show list of PDFs with their chats
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                PDF Chats
              </h1>
              <p className="text-gray-600">
                View and manage your PDF conversations
              </p>
            </div>
            <label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                size="lg"
                disabled={isUploading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload PDF
                  </>
                )}
              </Button>
            </label>
          </div>

          {/* PDFs List */}
          {isLoadingPdfs || isLoadingChats ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading PDFs and chats...</p>
              </div>
            </div>
          ) : pdfsWithChats && pdfsWithChats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfsWithChats.map((pdf: any) => (
                <Card
                  key={pdf.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => navigate(`/pdf-chat/${pdf.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {pdf.fileName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {pdf.pageCount} pages • {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Sessions Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">
                        {pdf.totalChats} {pdf.totalChats === 1 ? "conversation" : "conversations"}
                      </span>
                    </div>
                    
                    {/* Show recent chats */}
                    {pdf.chatSessions && pdf.chatSessions.slice(0, 3).map((session: any) => {
                      const firstMessage = session.messages?.[0];
                      const preview = firstMessage
                        ? firstMessage.content.substring(0, 60) + (firstMessage.content.length > 60 ? "..." : "")
                        : "Chat";
                      
                      return (
                        <div
                          key={session.id}
                          className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/pdf-chat/${pdf.id}`);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <p className="text-xs text-gray-700 truncate flex-1">
                              {preview}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(session.lastUpdated).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/pdf-chat/${pdf.id}`);
                    }}
                  >
                    Open Chat
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No PDF chats yet
              </h2>
              <p className="text-gray-600 mb-8">
                Upload a PDF document to start an AI-powered conversation
              </p>
              <label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  size="lg"
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload Your First PDF
                    </>
                  )}
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Maximum file size: 50MB
              </p>
            </Card>
          )}
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
        {/* Header - Clean and Simple */}
        <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
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
              <h1 className="text-lg font-semibold text-gray-900">
                {pdfData.fileName}
              </h1>
              <p className="text-xs text-gray-500">
                {pdfData.pageCount} pages • {(pdfData.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showPdf ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowPdf(!showPdf);
                if (!showPdf && !showChat) setShowChat(true);
              }}
            >
              {showPdf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Split Layout: PDF Viewer, Chat History, and Chat */}
        <div className={`flex-1 gap-4 p-4 overflow-hidden min-h-0 flex`}>
          {/* Chat History Sidebar */}
          {showHistory && showChat && (
            <div className="w-64 min-w-[256px] h-full min-h-0 overflow-hidden">
              <ChatHistorySidebar
                pdfId={id!}
                currentSessionId={currentSessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
              />
            </div>
          )}

          {/* PDF Viewer */}
          {showPdf && (
            <div className={`h-full min-h-0 overflow-hidden ${
              showChat ? "flex-1" : "w-full"
            }`}>
              <PDFViewer fileUrl={pdfData.fileUrl} fileName={pdfData.fileName} />
            </div>
          )}

          {/* Chat Interface */}
          {showChat && (
            <div className={`h-full min-h-0 overflow-hidden flex flex-col ${
              showPdf ? "flex-1" : "w-full"
            }`}>
              {isLoadingMessages && currentSessionId ? (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading chat...</p>
                  </div>
                </Card>
              ) : (
                <ChatInterface
                  key={currentSessionId} // Force remount when session changes
                  pdfId={id!}
                  sessionId={currentSessionId}
                  initialMessages={messages}
                  onMessageAdded={handleMessageAdded}
                  onFileUpload={handleFileUpload}
                />
              )}
            </div>
          )}
        </div>
        
        {/* VAPI Voice Assistant - Fixed Position */}
        {pdfData.extractedText && (
          <VoiceAssistant
            assistantType="pdf"
            pdfData={{
              fileName: pdfData.fileName,
              content: pdfData.geminiSummary || pdfData.extractedText, // Use stored Gemini summary if available, fallback to extracted text
              pageCount: pdfData.pageCount,
              imageUrls: pdfData.imageUrls || [],
              imageAnalysis: pdfData.imageAnalysis || null,
              geminiSummary: pdfData.geminiSummary || null, // Pass summary separately for reference
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PDFChat;
