
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  noteContent: string;
  noteTitle: string;
  onSummary?: (summary: string) => void;
}

const VoiceAssistant = ({ noteContent, noteTitle, onSummary }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
    
    synthRef.current = window.speechSynthesis;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    setIsListening(true);
    recognitionRef.current.start();
    
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processVoiceCommand(finalTranscript);
      }
    };
    
    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: "Please try again.",
        variant: "destructive"
      });
    };
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      let aiResponse = "";
      
      if (command.toLowerCase().includes('summarize') || command.toLowerCase().includes('summary')) {
        aiResponse = generateSummary(noteContent);
      } else if (command.toLowerCase().includes('organize') || command.toLowerCase().includes('structure')) {
        aiResponse = generateOrganizationSuggestions(noteContent);
      } else if (command.toLowerCase().includes('key points') || command.toLowerCase().includes('main ideas')) {
        aiResponse = extractKeyPoints(noteContent);
      } else {
        aiResponse = `I can help you with: summarizing your note, organizing content, or extracting key points. What would you like me to do with "${noteTitle}"?`;
      }
      
      setResponse(aiResponse);
      speakResponse(aiResponse);
      
      if (onSummary && command.toLowerCase().includes('summarize')) {
        onSummary(aiResponse);
      }
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process your request.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSummary = (content: string): string => {
    const textContent = content.replace(/<[^>]*>/g, '');
    const words = textContent.split(' ').filter(word => word.length > 0);
    
    if (words.length < 50) {
      return `This is a brief note with ${words.length} words. The main content focuses on the topics discussed in "${noteTitle}".`;
    }
    
    const sentences = textContent.split('.').filter(s => s.trim().length > 0);
    const keySentences = sentences.slice(0, 3).join('. ');
    
    return `Summary of "${noteTitle}": ${keySentences}. This note contains ${words.length} words and covers the main topics in detail.`;
  };

  const generateOrganizationSuggestions = (content: string): string => {
    return `For better organization of "${noteTitle}", I suggest: 1) Add clear headings and subheadings, 2) Use bullet points for key information, 3) Group related topics together, 4) Add a conclusion or summary section.`;
  };

  const extractKeyPoints = (content: string): string => {
    const textContent = content.replace(/<[^>]*>/g, '');
    const sentences = textContent.split('.').filter(s => s.trim().length > 20);
    const keyPoints = sentences.slice(0, 3).map((s, i) => `${i + 1}. ${s.trim()}`).join('. ');
    
    return `Key points from "${noteTitle}": ${keyPoints}`;
  };

  const speakResponse = (text: string) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Mic className="h-5 w-5" />
          AI Voice Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? "destructive" : "default"}
            className="flex-1"
            disabled={isProcessing}
          >
            {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>
          
          <Button
            onClick={isSpeaking ? stopSpeaking : undefined}
            variant="outline"
            disabled={!isSpeaking}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
        
        {transcript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">You said:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}
        
        {response && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">AI Response:</p>
            <p className="text-sm">{response}</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <p className="text-sm text-gray-600 mt-2">Processing...</p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          Try saying: "Summarize this note", "Organize the content", or "What are the key points?"
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAssistant;
