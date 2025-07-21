
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import WordLikeEditor from "@/components/editor/WordLikeEditor";
import { useStore } from "@/store/useStore";

const NewNote = () => {
  useScrollToTop();
  
  const [formData, setFormData] = useState({
    title: "",
    synopsis: "",
    content: "",
    isPublic: false
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNote } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive"
      });
      return;
    }

    addNote(formData);
    
    toast({
      title: "Note saved!",
      description: "Your note has been saved successfully.",
    });
    navigate('/dashboard');
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Create New Note</h1>
          </div>
        </div>

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

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleChange("isPublic", checked)}
                />
                <Label htmlFor="isPublic">Make this note public</Label>
              </div>
            </CardContent>
          </Card>
          <div>
            <Label className="text-base font-medium mb-4 block">Content</Label>
            <WordLikeEditor
              value={formData.content}
              onChange={(value) => handleChange("content", value)}
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Note
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewNote;
