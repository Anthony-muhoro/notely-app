import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModernSwitch } from "@/components/ui/modern-switch";
import { Save, Wand2, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import WordLikeEditor from "@/components/editor/WordLikeEditor";
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
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNote } = useStore();

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
    } catch (error) {
      console.error("AI generation error:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate content with AI. Please try again.",
        variant: "destructive",
      });
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
    } catch (error) {
      console.error("AI rewrite error:", error);
      toast({
        title: "Rewrite failed",
        description: "Failed to rewrite content with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRewritingAI(false);
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
                <CardTitle className="flex items-center justify-between">
                  <span>Note Details</span>
                  <Button
                    onClick={handleWriteWithAI}
                    disabled={isGeneratingAI || !formData.title.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
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

              <div className="min-h-[400px]">
                <WordLikeEditor
                  value={formData.content}
                  onChange={(value) => handleChange("content", value)}
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
