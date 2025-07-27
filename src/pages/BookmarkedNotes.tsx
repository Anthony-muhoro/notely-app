
import { Bookmark, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/store/useStore";
import { Link } from "react-router-dom";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

const BookmarkedNotes = () => {
  useScrollToTop();
  const { getBookmarkedNotes } = useStore();
  const bookmarkedNotes = getBookmarkedNotes();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <Bookmark className="h-5 w-5 md:h-8 md:w-8 text-orange-500 mr-2" />
              Bookmarked Notes
            </h1>
            <p className="text-gray-600 text-sm mt-1">Notes you want to revisit later</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search bookmarked notes..." className="pl-10 w-full" />
          </div>
        </div>
        
        {bookmarkedNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base md:text-lg line-clamp-2">{note.title}</CardTitle>
                    <Bookmark className="h-4 w-4 text-orange-500 ml-2 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{note.synopsis}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                    <Link to={`/note/${note.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookmarked notes yet</h3>
            <p className="text-gray-500 mb-6">Bookmark notes you want to reference later</p>
            <Link to="/dashboard">
              <Button>Browse Notes</Button>
            </Link>
          </div>
        )}
      </div>
      <VoiceAssistant 
        pageContext="I can help you manage your bookmarked notes, find specific saved content, or suggest reading strategies."
      />
    </DashboardLayout>
  );
};

export default BookmarkedNotes;
