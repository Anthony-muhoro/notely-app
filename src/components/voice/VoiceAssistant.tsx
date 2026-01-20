import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, PhoneOff, Volume2, Sparkles, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  initializeVapi,
  startVapiCall,
  startExplainNoteCall,
  startPdfCall,
  stopVapiCall,
  getVapiInstance,
  isCallActive,
  isVapiInitialized,
  getCurrentAssistantType,
} from "@/lib/vapi";
import { useAuth } from "@/store/useAuth";

interface VoiceAssistantProps {
  context?: string;
  assistantType?: "default" | "explain" | "pdf";
  noteData?: {
    title: string;
    content: string;
    dateCreated: string;
    lastUpdated: string;
  };
  pdfData?: {
    fileName: string;
    content: string;
    pageCount: number;
    imageUrls?: string[];
    imageAnalysis?: string | null;
    geminiSummary?: string | null;
  };
}

const VoiceAssistant = ({
  assistantType = "default",
  noteData,
  pdfData,
}: VoiceAssistantProps) => {
  const [isCallActiveState, setIsCallActiveState] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only initialize if not already initialized
    if (!isVapiInitialized()) {
      const initResult = initializeVapi();
      if (!initResult) {
        console.error("Failed to initialize Vapi");
      }
    }
  }, []);

  useEffect(() => {
    const vapi = getVapiInstance();
    if (!vapi) return;

    const handleCallStart = () => {
      setIsCallActiveState(true);
      setIsConnecting(false);
      setCallDuration(0);
    };

    const handleCallEnd = () => {
      setIsCallActiveState(false);
      setIsListening(false);
      setIsSpeaking(false);
      setIsConnecting(false);
      setCallDuration(0);
    };

    const handleSpeechStart = () => {
      setIsListening(true);
      setIsSpeaking(false);
    };

    const handleSpeechEnd = () => {
      setIsListening(false);
    };

    const handleBotSpeechStart = () => {
      setIsSpeaking(true);
      setIsListening(false);
    };

    const handleBotSpeechEnd = () => {
      setIsSpeaking(false);
    };

    // Handle tool-calls for navigation
    const handleMessage = (message: any) => {
      if (message.type === "tool-calls" && message.toolCalls) {
        message.toolCalls.forEach((toolCall: any) => {
          if (toolCall.function?.name === "navigate") {
            try {
              const args = typeof toolCall.function.arguments === "string"
                ? JSON.parse(toolCall.function.arguments)
                : toolCall.function.arguments;
              
              const path = args?.path;
              if (path && typeof path === "string") {
                console.log("Navigating to:", path);
                // Navigate smoothly without interrupting the call
                navigate(path);
                // Update context for new page after a short delay
                setTimeout(() => {
                  if (isCallActive() && getCurrentAssistantType() === "default") {
                    // Call is still active, just navigate - don't restart
                    vapi.say(`Navigating to ${path === "/dashboard" ? "my notes" : path.replace("/", "").replace("-", " ")}`);
                  }
                }, 100);
              }
            } catch (error) {
              console.error("Error parsing navigation arguments:", error);
            }
          }
        });
      }
    };

    // Remove any existing listeners first
    vapi.off("call-start", handleCallStart);
    vapi.off("call-end", handleCallEnd);
    vapi.off("speech-start", handleSpeechStart);
    vapi.off("speech-end", handleSpeechEnd);
    vapi.off("message", handleMessage);

    // Add new listeners
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("message", handleMessage);

    // Check if call is already active on mount
    setIsCallActiveState(isCallActive());

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("message", handleMessage);
    };
  }, [navigate]);

  // Update assistant context when page changes (for smooth navigation)
  useEffect(() => {
    const vapi = getVapiInstance();
    if (!vapi || !isCallActiveState || getCurrentAssistantType() !== "default") {
      return;
    }

    // Page changed - log it (context is set on call start for smooth navigation)
    if (assistantType === "default") {
      console.log("Page changed to:", location.pathname);
    }
  }, [location.pathname, isCallActiveState, assistantType]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActiveState) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActiveState]);

  const handleStartCall = async () => {
    if (isCallActiveState) {
      await stopVapiCall();
      return;
    }

    setIsConnecting(true);
    try {
      if (assistantType === "explain" && noteData) {
        const success = await startExplainNoteCall(
          { firstName: user?.firstName || "User" },
          noteData.title,
          noteData.content || "No content available",
          noteData.dateCreated,
          noteData.lastUpdated
        );

        if (!success) {
          console.error("Failed to start explain note call");
        }
      } else if (assistantType === "pdf" && pdfData) {
        const success = await startPdfCall(
          { firstName: user?.firstName || "User" },
          pdfData.fileName,
          pdfData.content || "No content available",
          pdfData.pageCount,
          pdfData.imageUrls || [],
          pdfData.imageAnalysis || null
        );

        if (!success) {
          console.error("Failed to start PDF call");
        }
      } else {
        const success = await startVapiCall(
          { firstName: user?.firstName || "User" },
          location.pathname
        );
        if (!success) {
          console.error("Failed to start Vapi call");
        }
      }
    } catch (error) {
      console.error("Error starting call:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEndCall = async () => {
    const success = await stopVapiCall();
    if (!success) {
      console.error("Failed to stop call");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = () => {
    if (isConnecting) return "bg-yellow-500";
    if (isListening) return "bg-red-500 animate-pulse";
    if (isSpeaking) return "bg-blue-500 animate-pulse";
    if (isCallActiveState) return "bg-green-500";
    return "bg-gray-400";
  };

  const getAssistantName = () => {
    if (assistantType === "explain") return "MUHORO";
    if (assistantType === "pdf") return "PDF Assistant";
    return "Notely";
  };

  if (!isCallActiveState && !isConnecting) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleStartCall}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 group"
          size="icon"
        >
          <Bot className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-bounce" />
        </Button>
        <div className="absolute bottom-20 right-0 bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Click to start voice chat with {getAssistantName()}!
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
            <div>
              <span className="text-sm font-semibold text-gray-800">
                {getAssistantName()} Assistant
              </span>
              <p className="text-xs text-gray-500">
                {isConnecting
                  ? "Connecting..."
                  : isListening
                  ? "Listening..."
                  : isSpeaking
                  ? "Speaking..."
                  : isCallActiveState
                  ? "Connected"
                  : "Start Voice Chat"}
              </p>
            </div>
          </div>
          {isCallActiveState && (
            <div className="text-xs text-gray-500 font-mono">
              {formatDuration(callDuration)}
            </div>
          )}
        </div>
        {isCallActiveState && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              {isListening ? (
                <>
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-red-500 rounded animate-pulse"></div>
                    <div
                      className="w-1 h-3 bg-red-400 rounded animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 h-5 bg-red-500 rounded animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <p className="text-sm text-red-800 font-medium">
                    Listening...
                  </p>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="h-4 w-4 text-blue-600 animate-pulse" />
                  <p className="text-sm text-blue-800 font-medium">
                    Speaking...
                  </p>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    Ready to help!
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleEndCall}
            variant="destructive"
            size="sm"
            className="flex-1 gap-2"
            disabled={isConnecting}
          >
            <PhoneOff className="h-4 w-4" />
            End Call
          </Button>
        </div>
        {isConnecting && (
          <div className="flex items-center justify-center gap-2 py-2 mt-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">
              Connecting to {getAssistantName()}...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
