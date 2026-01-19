import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModernSwitch } from "@/components/ui/modern-switch";
import { Save, Wand2, RotateCcw, Loader2, Sparkles, Mic, FileDown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import AdvancedEditor from "@/components/editor/AdvancedEditor";
import { useStore } from "@/store/useStore";
import { useMutation } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

interface FormData {
  title: string;
  synopsis: string;
  content: string;
  isPublic: boolean;
}

interface UndoState {
  synopsis: string;
  content: string;
}

const NewNote = () => {
  useScrollToTop();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    synopsis: "",
    content: "",
    isPublic: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRewritingAI, setIsRewritingAI] = useState(false);
  const [isVoiceNote, setIsVoiceNote] = useState(false);
  const [isEnhancedNote, setIsEnhancedNote] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNote } = useStore();

  // Initialize Web Speech API with real-time updates
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        // Update transcript in real-time
        const newTranscript = voiceTranscript + finalTranscript;
        setVoiceTranscript(newTranscript);

        // Real-time update: Add to editor content as user speaks
        if (finalTranscript && formData.content) {
          setFormData((prev) => ({
            ...prev,
            content: prev.content + (prev.content.endsWith("</p>") ? "" : "<p>") + finalTranscript + "</p>",
          }));
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
  }, [toast, voiceTranscript, formData.content]);

  const saveCurrentState = () => {
    const currentState: UndoState = {
      synopsis: formData.synopsis,
      content: formData.content,
    };
    setUndoStack((prev) => [...prev, currentState]);
  };
  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast({
        title: "Nothing to undo",
        description: "No previous states available",
        variant: "destructive",
      });
      return;
    }

    const lastState = undoStack[undoStack.length - 1];
    setFormData((prev) => ({
      ...prev,
      synopsis: lastState.synopsis,
      content: lastState.content,
    }));

    setUndoStack((prev) => prev.slice(0, -1));

    toast({
      title: "Changes undone",
      description: "Restored previous version",
    });
  };
  const removeMarkdown = (text: string) => {
    return text.replace(/[*_~`#>\[\]()\-!]/g, "").trim();
  };
  // Handle AI content generation
  const handleWriteWithAI = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title to generate content with AI",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);
    saveCurrentState(); //

    try {
      const response = await ApiClient.post("/notes/gemininote", {
        title: formData.title,
      });
      console.log(response.data.data);
      const { synopsis, content } = response.data.data;

      setFormData((prev) => ({
        ...prev,
        synopsis: removeMarkdown(synopsis || prev.synopsis),
        content: removeMarkdown(content || prev.content),
      }));

      toast({
        title: "Content generated successfully",
        description: "AI has created your note content",
      });
    } catch (error: any) {
      console.error("AI generation error:", error);
      const errorData = error?.response?.data;
      
      // Handle quota exceeded errors
      if (errorData?.error === "QUOTA_EXCEEDED" || error?.response?.status === 429) {
        const retryAfter = errorData?.retryAfter || 60;
        toast({
          title: "AI Service Quota Exceeded",
          description: `You've reached the AI service limit. Please try again in ${retryAfter} seconds or check your API plan.`,
          variant: "destructive",
        });
      } else {
        // Generic error
        toast({
          title: "Generation failed",
          description: errorData?.message || "Failed to generate content with AI. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRewriteWithAI = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title to rewrite content with AI",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim() && !formData.synopsis.trim()) {
      toast({
        title: "No content to rewrite",
        description: "Please add some content before using AI rewrite",
        variant: "destructive",
      });
      return;
    }

    setIsRewritingAI(true);
    saveCurrentState();

    try {
      const response = await ApiClient.post("/notes/rewrite", {
        title: formData.title,
        existingContent: formData.content,
        existingSynopsis: formData.synopsis,
        action: "rewrite",
      });

      const { synopsis, content } = response.data;

      setFormData((prev) => ({
        ...prev,
        synopsis: synopsis || prev.synopsis,
        content: content || prev.content,
      }));

      toast({
        title: "Content rewritten successfully",
        description: "AI has improved your note content",
      });
    } catch (error: any) {
      console.error("AI rewrite error:", error);
      const errorData = error?.response?.data;
      
      // Handle quota exceeded errors
      if (errorData?.error === "QUOTA_EXCEEDED" || error?.response?.status === 429) {
        const retryAfter = errorData?.retryAfter || 60;
        toast({
          title: "AI Service Quota Exceeded",
          description: `You've reached the AI service limit. Please try again in ${retryAfter} seconds or check your API plan.`,
          variant: "destructive",
        });
      } else {
        // Generic error
        toast({
          title: "Rewrite failed",
          description: errorData?.message || "Failed to rewrite content with AI. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsRewritingAI(false);
    }
  };

  // Voice-to-note handlers
  const startRecording = () => {
    if (recognition) {
      setVoiceTranscript("");
      recognition.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak your note idea...",
      });
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
      setIsRecording(false);
    }
  };

  const handleCreateFromVoice = async () => {
    if (!voiceTranscript.trim()) {
      toast({
        title: "No voice input",
        description: "Please record your voice or enter a transcript",
        variant: "destructive",
      });
      return;
    }

    setIsVoiceNote(true);
    saveCurrentState();

    try {
      const response = await ApiClient.post("/notes/voice-note", {
        voiceTranscript: voiceTranscript,
        topic: formData.title || undefined,
        autoSave: false,
      });

      const { title, synopsis, content } = response.data.data;

      setFormData((prev) => ({
        ...prev,
        title: title || prev.title,
        synopsis: removeMarkdown(synopsis || prev.synopsis),
        content: removeMarkdown(content || prev.content),
      }));

      setVoiceTranscript("");

      toast({
        title: "Note generated from voice",
        description: "Your voice has been converted to a formatted note",
      });
    } catch (error: any) {
      console.error("Voice-to-note error:", error);
      const errorData = error?.response?.data;
      
      if (errorData?.error === "QUOTA_EXCEEDED" || error?.response?.status === 429) {
        const retryAfter = errorData?.retryAfter || 60;
        toast({
          title: "AI Service Quota Exceeded",
          description: `You've reached the AI service limit. Please try again in ${retryAfter} seconds.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voice-to-note failed",
          description: errorData?.message || "Failed to generate note from voice. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsVoiceNote(false);
    }
  };

  const handleGenerateEnhancedNote = async () => {
    const topic = formData.title.trim() || prompt("Enter a topic for your enhanced note:");
    
    if (!topic) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate an enhanced note",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancedNote(true);
    saveCurrentState();

    try {
      const response = await ApiClient.post("/notes/enhanced-note", {
        topic: topic,
        includeCharts: true,
        includeImages: true,
        autoSave: false,
      });

      const { title, synopsis, content, charts, images } = response.data.data;

      setFormData((prev) => ({
        ...prev,
        title: title || prev.title,
        synopsis: removeMarkdown(synopsis || prev.synopsis),
        content: removeMarkdown(content || prev.content),
      }));

      if (charts && charts.length > 0) {
        toast({
          title: "Enhanced note generated",
          description: `Note created with ${charts.length} chart(s) and ${images?.length || 0} image(s) suggestions`,
        });
      } else {
        toast({
          title: "Enhanced note generated",
          description: "Your comprehensive note is ready",
        });
      }
    } catch (error: any) {
      console.error("Enhanced note error:", error);
      const errorData = error?.response?.data;
      
      if (errorData?.error === "QUOTA_EXCEEDED" || error?.response?.status === 429) {
        const retryAfter = errorData?.retryAfter || 60;
        toast({
          title: "AI Service Quota Exceeded",
          description: `You've reached the AI service limit. Please try again in ${retryAfter} seconds.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Enhanced note generation failed",
          description: errorData?.message || "Failed to generate enhanced note. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsEnhancedNote(false);
    }
  };

  const { mutate } = useMutation({
    mutationKey: ["create-note"],
    mutationFn: async () => {
      const response = await ApiClient.post("/notes", formData);
      console.log(response.data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      addNote(formData);
      mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Create New Note
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>Note Details</span>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleGenerateEnhancedNote}
                      disabled={isEnhancedNote}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl text-sm"
                      size="sm"
                    >
                      {isEnhancedNote ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Enhanced Note
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleWriteWithAI}
                      disabled={isGeneratingAI || !formData.title.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl text-sm"
                      size="sm"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create with AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (Required for AI generation)
                    </span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter note title..."
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="text-lg font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="synopsis">Synopsis</Label>
                  <Textarea
                    id="synopsis"
                    placeholder="Brief description of your note..."
                    value={formData.synopsis}
                    onChange={(e) => handleChange("synopsis", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Voice-to-Note Section */}
                <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                    Create Note from Voice
                  </Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? "destructive" : "default"}
                        size="sm"
                        className="flex-1"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </Button>
                      <Button
                        onClick={handleCreateFromVoice}
                        disabled={isVoiceNote || !voiceTranscript.trim()}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {isVoiceNote ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Note
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Your voice transcript will appear here in real-time... Or type/paste your idea directly. Content will be added to the editor as you speak!"
                      value={voiceTranscript}
                      onChange={(e) => setVoiceTranscript(e.target.value)}
                      rows={3}
                      className="bg-white"
                    />
                    {isRecording && (
                      <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                        <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
                        🎤 Recording... Your words are being added to the note in real-time!
                      </div>
                    )}
                    {voiceTranscript && !isRecording && (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Click "Generate Note" to organize and format this transcript into a professional note
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <ModernSwitch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      handleChange("isPublic", checked)
                    }
                  />
                  <Label htmlFor="isPublic" className="font-medium">
                    Make this note public
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Content</Label>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    variant="outline"
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Undo
                  </Button>

                  <Button
                    onClick={handleRewriteWithAI}
                    disabled={isRewritingAI || !formData.title.trim()}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                  >
                    {isRewritingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rewriting...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Rewrite with AI
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.title.trim()}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Note
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="min-h-[600px]">
                <AdvancedEditor
                  value={formData.content}
                  onChange={(value) => handleChange("content", value)}
                  onImageGenerate={async (description: string) => {
                    try {
                      const response = await ApiClient.post("/notes/generate-image", {
                        description,
                      });
                      return response.data.data.imageUrl;
                    } catch (error) {
                      console.error("Image generation failed:", error);
                      throw error;
                    }
                  }}
                  placeholder="Start writing your note... Use voice input for hands-free note creation!"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <VoiceAssistant assistantType="default" />
    </DashboardLayout>
  );
};

export default NewNote;
