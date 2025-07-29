import { Bookmark, Calendar, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ApiClient from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

const NoteSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 w-4 bg-gray-200 rounded ml-2"></div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </CardContent>
  </Card>
);

const BookmarkedNotes = () => {
  useScrollToTop();
  const queryClient = useQueryClient();
  const [unbookmarkingId, setUnbookmarkingId] = useState(null);

  const { data: bookmarkedNotes = [], isLoading } = useQuery({
    queryKey: ["get-bookmarkednotes"],
    queryFn: async () => {
      const response = await ApiClient.get("/notes/bookmarked");
      return response.data.notes;
    },
  });

  const handleNoteUnbooking = async (id) => {
    setUnbookmarkingId(id);
    try {
      const response = await ApiClient.patch(`/notes/unbookmark/${id}`);

      toast(
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">{response?.data.message}</span>
        </div>
      );

      queryClient.invalidateQueries(["get-bookmarkednotes"]);
    } catch (error) {
      toast(
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium">Something went wrong</span>
        </div>
      );
    } finally {
      setUnbookmarkingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bookmark className="h-8 w-8 text-orange-500 mr-3" />
              Bookmarked Notes
            </h1>
            <p className="text-gray-600 mt-2">
              Notes you want to revisit later
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <NoteSkeleton key={index} />
            ))}
          </div>
        ) : bookmarkedNotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-lg transition-shadow group relative"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 pr-2">
                      {note.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleNoteUnbooking(note.id)}
                      disabled={unbookmarkingId === note.id}
                    >
                      {unbookmarkingId === note.id ? (
                        <div className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {note.synopsis}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(note.dateCreated).toLocaleDateString()}
                    </div>
                    <Link to={`/note/${note.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
                <div className="absolute top-2 right-2">
                  <Bookmark className="h-3 w-3 text-orange-500 opacity-60" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No bookmarked notes yet
            </h3>
            <p className="text-gray-500 mb-6">
              Bookmark notes you want to reference later
            </p>
            <Link to="/dashboard">
              <Button>Browse Notes</Button>
            </Link>
          </div>
        )}
      </div>
      <VoiceAssistant assistantType="default" />
    </DashboardLayout>
  );
};

export default BookmarkedNotes;
