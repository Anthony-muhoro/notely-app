import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trash2,
  Pin,
  Bookmark,
  MoreHorizontal,
  User,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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
import { NoteDetailsSkeleton } from "@/components/ui/note-details-skeleton";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import { useAuth } from "@/store/useAuth";
import { toast } from "sonner";

const NoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isBookmarked, setisBookmarked] = useState(false);
  const [isPinned, setisPinned] = useState(false);
  const { user } = useAuth();
  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const response = await ApiClient.get(`/notes/fullnote/${id}`);

      return response.data.data;
    },
    enabled: !!id,
  });

  const handlePin = async () => {
    try {
      const response = await ApiClient.patch(`/notes/pin/${id}`);
      toast(<p>{response?.data.message}</p>);
    } catch (error: any) {
      toast(<p>something went wrong</p>);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await ApiClient.patch(`/notes/bookmark/${id}`);
      toast(<p>{response?.data.message}</p>);
    } catch (error: any) {
      toast(<p>something went wrong</p>);
    }
  };

  const handleDelete = async () => {
    try {
      await ApiClient.delete(`/notes/${id}`);
      toast(<p>note deleted</p>);
      navigate("/dashboard");
    } catch {
      toast(<p>something went wrong</p>);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <NoteDetailsSkeleton />
        <VoiceAssistant context={`Hello ${user?.firstName}`} />
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
        <VoiceAssistant
          assistantType="explain"
          noteData={{
            title: note.title,
            content: note.content,
            dateCreated: note.dateCreated,
            lastUpdated: note.lastUpdated,
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-end mb-8">
          <div className="flex items-center space-x-2">
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
                      className="text-red-600 focus:text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete note
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border border-gray-200 shadow-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900">
                        Delete note?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        This will move the note to trash. You can restore it
                        later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white"
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

        <div className="bg-white rounded-lg shadow-lg border-0 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {note.title}
            </h1>

            <div className="flex items-center space-x-2 mb-6">
              {note.isPublic && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 border-green-200"
                >
                  Public
                </Badge>
              )}
              {isPinned && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700 border-orange-200"
                >
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {isBookmarked && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  Bookmarked
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={note.user?.avatar} alt="Author" />
                <AvatarFallback className="bg-orange-100 text-orange-700">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {note.user?.firstName || "You"}
                </p>
                <p className="text-sm text-gray-600">Author</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 border-b pb-6">
              <div>
                <p className="font-medium text-gray-700">Date Published</p>
                <p>
                  {new Date(note.dateCreated).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Last Updated</p>
                <p>
                  {new Date(note.lastUpdated).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div
            className="prose max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </div>
      </div>
      <VoiceAssistant
        assistantType="explain"
        noteData={{
          title: note.title,
          content: note.content,
          dateCreated: note.dateCreated,
          lastUpdated: note.lastUpdated,
        }}
      />
    </DashboardLayout>
  );
};

export default NoteDetails;
