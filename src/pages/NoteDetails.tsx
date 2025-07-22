import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Pin,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPinned, setIsPinned] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const response = await ApiClient.get(`/notes/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const handlePin = () => {
    setIsPinned((prev) => !prev);
    toast({
      title: isPinned ? "Note unpinned" : "Note pinned",
      description: isPinned
        ? "Note removed from pinned items."
        : "Note added to pinned items.",
    });
  };

  const handleBookmark = () => {
    setIsBookmarked((prev) => !prev);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Note bookmarked",
      description: isBookmarked
        ? "Note removed from bookmarks."
        : "Note added to bookmarks.",
    });
  };

  const handleDelete = async () => {
    try {
      await ApiClient.delete(`/notes/${id}`);
      toast({
        title: "Note deleted",
        description: "Note has been moved to trash.",
      });
      navigate("/dashboard");
    } catch {
      toast({
        title: "Failed to delete",
        description: "Something went wrong deleting the note.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <p className="text-gray-600 text-lg">Loading note...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !note) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Note not found
          </h1>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate(`/edit/${id}`)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePin}>
                  <Pin className="mr-2 h-4 w-4" />
                  {isPinned ? "Unpin" : "Pin"} note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBookmark}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  {isBookmarked ? "Remove bookmark" : "Bookmark"}
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete note
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete note?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the note to trash. You can restore it
                        later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Note Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {note.title}
            </h1>
            {note.synopsis && (
              <p className="text-lg text-gray-600 mb-4">{note.synopsis}</p>
            )}
            <div className="flex items-center space-x-2 mb-4">
              {note.isPublic && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700"
                >
                  Public
                </Badge>
              )}
              {isPinned && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700"
                >
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {isBookmarked && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  Bookmarked
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 border-b pb-4">
              <p>Created: {new Date(note.dateCreated).toLocaleDateString()}</p>
              <p>
                Last updated: {new Date(note.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NoteDetails;
