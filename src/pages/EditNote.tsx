import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Wand2, RotateCcw, Loader2 } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import WordLikeEditor from "@/components/editor/WordLikeEditor";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ModernSwitch } from "@/components/ui/modern-switch";
import { toast } from "sonner";
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

const EditNote = () => {
  useScrollToTop();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewritingAI, setIsRewritingAI] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const {
    data: noteToEdit,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["get-a-note", id],
    queryFn: async () => {
      const response = await ApiClient.get(`/notes/fullnote/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const [formData, setFormData] = useState<FormData>({
    title: "",
    synopsis: "",
    content: "",
    isPublic: false,
  });

  useEffect(() => {
    if (noteToEdit && !isDataLoaded) {
      setFormData({
        title: noteToEdit.title || "",
        synopsis: noteToEdit.synopsis || "",
        content: noteToEdit.content || "",
        isPublic: noteToEdit.isPublic || false,
      });
      setIsDataLoaded(true);
    }
  }, [noteToEdit, isDataLoaded]);

  const saveCurrentState = () => {
    const currentState: UndoState = {
      synopsis: formData.synopsis,
      content: formData.content,
    };
    setUndoStack((prev) => [...prev, currentState]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const lastState = undoStack[undoStack.length - 1];
    setFormData((prev) => ({
      ...prev,
      synopsis: lastState.synopsis,
      content: lastState.content,
    }));

    setUndoStack((prev) => prev.slice(0, -1));
  };

  const stripMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/`{3}[\s\S]*?`{3}/g, "")
      .replace(/`(.*?)`/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*>\s+/gm, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const handleRewriteWithAI = async () => {
    if (!formData.title.trim()) {
      toast(<p>Title required for AI rewrite</p>);
      return;
    }

    if (!formData.content.trim() && !formData.synopsis.trim()) {
      toast(<p>Add content before using AI rewrite</p>);
      return;
    }

    setIsRewritingAI(true);
    saveCurrentState();

    try {
      const response = await ApiClient.post("/notes/gemininote", {
        title: formData.title,
        existingContent: formData.content,
        existingSynopsis: formData.synopsis,
        action: "rewrite",
      });

      const { synopsis, content } = response.data.data;

      setFormData((prev) => ({
        ...prev,
        synopsis: synopsis ? stripMarkdown(synopsis) : prev.synopsis,
        content: content ? stripMarkdown(content) : prev.content,
      }));
    } catch (error: any) {
      console.error("AI rewrite error:", error);
      const errorData = error?.response?.data;
      
      // Handle quota exceeded errors
      if (errorData?.error === "QUOTA_EXCEEDED" || error?.response?.status === 429) {
        const retryAfter = errorData?.retryAfter || 60;
        toast(
          <div className="max-w-sm w-full">
            <p className="font-semibold">AI Service Quota Exceeded</p>
            <p className="text-sm text-gray-600">
              You've reached the AI service limit. Please try again in {retryAfter} seconds or check your API plan.
            </p>
          </div>
        );
      } else {
        toast(
          <div className="max-w-sm w-full">
            <p className="font-semibold">Rewrite failed</p>
            <p className="text-sm text-gray-600">
              {errorData?.message || "Failed to rewrite content with AI. Please try again."}
            </p>
          </div>
        );
      }
    } finally {
      setIsRewritingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.title.trim()) {
      toast(<p>Title is required</p>);
      setIsSubmitting(false);
      return;
    }

    try {
      await ApiClient.put(`/notes/${id}`, formData);
      navigate("/dashboard");
    } catch (error) {
      toast(<p>Failed to update note</p>);
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-64 bg-gray-200 rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-36 w-full bg-gray-200 rounded-xl" />
            <Skeleton className="h-40 w-full bg-gray-200 rounded-xl" />
            <Skeleton className="h-96 w-full bg-gray-200 rounded-xl" />
            <div className="flex justify-end space-x-4">
              <Skeleton className="h-10 w-24 bg-gray-200 rounded-lg" />
              <Skeleton className="h-10 w-32 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Edit Note
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <CardTitle className="text-gray-800 font-semibold">
                Note Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter note title..."
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="text-lg font-medium border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg h-12"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="synopsis" className="text-gray-700 font-medium">
                  Synopsis
                </Label>
                <Textarea
                  id="synopsis"
                  placeholder="Brief description of your note..."
                  value={formData.synopsis}
                  onChange={(e) => handleChange("synopsis", e.target.value)}
                  rows={3}
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg resize-none"
                />
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <ModernSwitch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    handleChange("isPublic", checked)
                  }
                />
                <Label htmlFor="isPublic" className="font-medium text-gray-700">
                  Make this note public
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xl font-semibold text-gray-800">
                Content
              </Label>
              <div className="flex space-x-3">
                <Button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  variant="outline"
                  className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Undo
                </Button>

                <Button
                  onClick={handleRewriteWithAI}
                  disabled={isRewritingAI || !formData.title.trim()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg rounded-lg px-6 py-2 font-medium transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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
                  className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 font-medium transition-all duration-200"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg rounded-lg px-6 py-2 font-medium transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Note
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="min-h-[400px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <WordLikeEditor
                value={formData.content}
                onChange={(value) => handleChange("content", value)}
              />
            </div>
          </div>
        </div>
      </div>
      <VoiceAssistant assistantType="default" />
    </DashboardLayout>
  );
};

export default EditNote;
