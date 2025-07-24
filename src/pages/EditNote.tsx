import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import WordLikeEditor from "@/components/editor/WordLikeEditor";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ModernSwitch } from "@/components/ui/modern-switch";
import VoiceAssistant from "@/components/ai/VoiceAssistant";

const EditNote = () => {
  useScrollToTop();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    data: noteToEdit,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["get-a-note", id],
    queryFn: async () => {
      const response = await ApiClient.get(`/notes/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const [formData, setFormData] = useState({
    title: "",
    synopsis: "",
    content: "",
    isPublic: false,
  });

  useEffect(() => {
    if (noteToEdit) {
      setFormData({
        title: noteToEdit.title,
        synopsis: noteToEdit.synopsis,
        content: noteToEdit.content,
        isPublic: noteToEdit.isPublic,
      });
    }
  }, [noteToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await ApiClient.put(`/notes/${id}`, formData);
      toast({
        title: "Note updated!",
        description: "Your note has been updated successfully.",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Something went wrong while updating the note.",
        variant: "destructive",
      });
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Note</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-36 w-full rounded-md" />
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-96 w-full rounded-md" />
              <div className="flex justify-end space-x-4">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full rounded-md" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Note Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
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
                      onCheckedChange={(checked) => handleChange("isPublic", checked)}
                    />
                    <Label htmlFor="isPublic" className="font-medium">
                      Make this note public
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="text-base font-medium mb-4 block">Content</Label>
                <WordLikeEditor
                  key={formData.content}
                  value={formData.content}
                  onChange={(value) => handleChange("content", value)}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

            <div className="lg:col-span-1">
              <VoiceAssistant
                noteContent={formData.content}
                noteTitle={formData.title}
                onSummary={(summary) => {
                  if (!formData.synopsis) {
                    handleChange("synopsis", summary);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditNote;
