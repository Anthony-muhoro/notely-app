import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Loader2, User, Bot, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ApiClient from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  pdfId: string;
  sessionId?: string;
  initialMessages?: Message[];
  onMessageAdded?: (message: Message) => void;
  onFileUpload?: (file: File) => void;
  key?: string; // Add key prop to force remount when session changes
}

const ChatInterface = ({
  pdfId,
  sessionId,
  initialMessages = [],
  onMessageAdded,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Sync messages when initialMessages change (session switch)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, sessionId]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        toast({
          title: "Speech recognition error",
          description: event.error,
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, sessionId]); // Also scroll when session changes

  const startRecording = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
    } else {
      toast({
        title: "Speech recognition not available",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    if (onMessageAdded) {
      onMessageAdded(userMessage);
    }

    try {
      console.log("=== FRONTEND: Starting chat request ===");
      console.log("PDF ID:", pdfId);
      console.log("User message:", userMessage.content);
      console.log("API URL:", `${import.meta.env.VITE_API_BASE_URL}/pdfs/${pdfId}/chat`);

      // Create streaming request
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/pdfs/${pdfId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ 
            message: userMessage.content,
            sessionId: sessionId 
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to get response" }));
        console.error("Response not OK:", errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to get response`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      console.log("Assistant message placeholder created");

      if (!reader) {
        console.error("No reader available from response body!");
        throw new Error("Streaming response not available");
      }

      console.log("Starting to read stream...");
      let chunkCount = 0;
      let dataEventCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream reading complete");
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`Raw chunk ${chunkCount} received (${chunk.length} bytes):`, chunk.substring(0, 100));

        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            dataEventCount++;
            try {
              const data = JSON.parse(line.slice(6));
              console.log(`Data event ${dataEventCount}:`, {
                hasChunk: !!data.chunk,
                chunkLength: data.chunk?.length || 0,
                done: data.done,
                error: data.error,
              });

              if (data.chunk) {
                assistantMessage.content += data.chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
                console.log(`Updated message content (total: ${assistantMessage.content.length} chars)`);
              }
              if (data.done) {
                console.log("=== STREAMING DONE ===");
                console.log("Final message length:", assistantMessage.content.length);
                console.log("Final message preview:", assistantMessage.content.substring(0, 200));
                if (onMessageAdded) {
                  onMessageAdded(assistantMessage);
                }
                break;
              }
              if (data.error) {
                console.error("Chat error from server:", data.error);
                assistantMessage.content = `Error: ${data.error}`;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing data event:", e, "Line:", line);
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      console.log(`=== FRONTEND: Stream complete ===`);
      console.log(`Total chunks: ${chunkCount}, Data events: ${dataEventCount}`);
      console.log(`Final message: ${assistantMessage.content.length} characters`);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-lg text-gray-900">AI Chat Assistant</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about the PDF or request summaries and explanations
        </p>
      </div>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium mb-2">Start a conversation</p>
            <p className="text-sm">
              Ask questions, request summaries, or get explanations about the PDF
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 items-start ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-900 shadow-sm"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-base font-semibold mt-2 mb-1 text-gray-900" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-2 text-gray-700 leading-relaxed" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-700" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="ml-2 text-gray-700" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
                      ),
                      pre: ({ node, ...props }) => (
                        <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2 text-sm" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-gray-900" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-300 pl-4 italic my-2 text-gray-600" {...props} />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              )}
            </div>
            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-2">
          {/* File Upload Button */}
          <label htmlFor="pdf-upload-input" className="sr-only">
            Upload new PDF file
          </label>
          <input
            id="pdf-upload-input"
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (file.type !== "application/pdf") {
                toast({
                  title: "Invalid file type",
                  description: "Please upload a PDF file",
                  variant: "destructive",
                });
                return;
              }

              if (onFileUpload) {
                setIsUploading(true);
                try {
                  await onFileUpload(file);
                } finally {
                  setIsUploading(false);
                  // Reset input
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              }
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            disabled={isUploading}
            title="Upload new PDF"
            className="flex-shrink-0"
            aria-label="Upload new PDF file"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>
          
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask a question about the PDF..."
            rows={3}
            className="resize-none flex-1"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
            <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
            Recording... Speak now
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChatInterface;
