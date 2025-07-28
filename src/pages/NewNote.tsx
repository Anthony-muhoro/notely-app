import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModernSwitch } from "@/components/ui/modern-switch";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import WordLikeEditor from "@/components/editor/WordLikeEditor";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import { useStore } from "@/store/useStore";
import { useMutation } from "@tanstack/react-query";
import ApiClient from "@/lib/api";

const NewNote = () => {
  useScrollToTop();

  const [formData, setFormData] = useState({
    title: "",
    synopsis: "",
    content: "",
    isPublic: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNote } = useStore();
  const { mutate } = useMutation({
    mutationKey: ["create-note"],
    mutationFn: async () => {
      const response = await ApiClient.post("/notes", formData);
      console.log(response.data);
      return response;
    },
    onSuccess: (data) => {
      navigate("/dashboard");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <VoiceAssistant context="new-note" />
    </DashboardLayout>
  );
};

export default NewNote;
