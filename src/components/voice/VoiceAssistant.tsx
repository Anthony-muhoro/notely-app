import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Bot, BotOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/store/useAuth";

interface VoiceAssistantProps {
  className?: string;
  pageContext?: string;
  contextualActions?: string[];
}

const VoiceAssistant = ({
  className = "",
  pageContext,
  contextualActions = [],
}: VoiceAssistantProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const location = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
    }
  }, []);

  const getContextualHelp = () => {
    if (pageContext) return pageContext;

    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return `hello ${user?.firstName} , My name is Anthony muhoro your AI Assistance. currently I'm in development mode. I'll be ready propably come wednesday. relax for now`;
      case "/new":
        return `hello ${user?.firstName} , My name is Anthony muhoro your AI Assistance. currently I'm in development mode. I'll be ready propably come wednesday. relax for now`;
      case "/trash":
        return `hello ${user?.firstName} , My name is Anthony muhoro your AI Assistance. currently I'm in development mode. I'll be ready propably come wednesday. relax for now`;
      case "/public":
        return `hello ${user?.firstName} , My name is Anthony muhoro your AI Assistance. currently I'm in development mode. I'll be ready propably come wednesday. relax for now`;
      case "/pinned":
        return `hello ${user?.firstName} , My name is Anthony muhoro your AI Assistance. currently I'm in development mode. I'll be ready propably come wednesday. relax for now`;
      case "/bookmarks":
        return `hello ${user?.firstName} , My name is Anthony muhoro your AI Assistance. currently I'm in development mode. I'll be ready propably come wednesday. relax for now`;
      default:
        return;
    }
  };

  const startCall = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Assistant Unavailable",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    setIsActive(true);
    setIsListening(true);
    recognitionRef.current.start();

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        processCommand(finalTranscript);
      }
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: "Please try again.",
        variant: "destructive",
      });
    };
  };

  const endCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsActive(false);
    setIsListening(false);
    setTranscript("");
  };

  const processCommand = (command: string) => {
    const response = `${getContextualHelp()}`;

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isActive) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={startCall}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all duration-200 transform hover:scale-105"
          size="icon"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={`fixed bottom-6 right-6 z-50 w-80 shadow-2xl border-0 ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-semibold text-gray-800">
              AI Assistant
            </span>
          </div>
          <Button
            onClick={endCall}
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full border-red-200 hover:bg-red-50"
          >
            <BotOff className="h-4 w-4 text-red-600" />
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            {getContextualHelp()}
          </p>
          {transcript && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm border">
              <p className="text-gray-500 text-xs mb-1 font-medium">
                You said:
              </p>
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={
              isListening
                ? () => setIsListening(false)
                : () => setIsListening(true)
            }
            className="flex items-center gap-2 px-4 py-2"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
