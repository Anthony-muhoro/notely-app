
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit3, Trash2, Pin, Bookmark, MoreHorizontal } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useStore } from "@/store/useStore";

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getNoteById, deleteNote } = useStore();

  const note = id ? getNoteById(id) : null;
  const [isPinned, setIsPinned] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handlePin = () => {
    setIsPinned(!isPinned);
    toast({
      title: isPinned ? "Note unpinned" : "Note pinned",
      description: isPinned ? "Note removed from pinned items." : "Note added to pinned items.",
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Note bookmarked",
      description: isBookmarked ? "Note removed from bookmarks." : "Note added to bookmarks.",
    });
  };

  const handleDelete = () => {
    if (note) {
      deleteNote(note.id);
      toast({
        title: "Note deleted",
        description: "Note has been moved to trash.",
      });
      navigate('/dashboard');
    }
  };

  if (!note) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Note not found</h1>
          <Button onClick={() => navigate('/dashboard')}>
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
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/edit/${id}`)}
            >
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
                        This action will move the note to trash. You can restore it later if needed.
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
          {/* Title and Meta */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{note.title}</h1>
            
            {/* Synopsis */}
            {note.synopsis && (
              <p className="text-lg text-gray-600 mb-4">{note.synopsis}</p>
            )}

            {/* Badges */}
            <div className="flex items-center space-x-2 mb-4">
              {isPinned && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {isBookmarked && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Bookmark className="h-3 w-3 mr-1" />
                  Bookmarked
                </Badge>
              )}
              {note.isPublic && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Public
                </Badge>
              )}
            </div>

            {/* Date info */}
            <div className="text-sm text-gray-500 border-b pb-4">
              <p>Created: {new Date(note.createdAt).toLocaleDateString()}</p>
              <p>Last updated: {new Date(note.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Content */}
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
