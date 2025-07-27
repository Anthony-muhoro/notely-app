
import { Pin, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/store/useStore";
import { Link } from "react-router-dom";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

const PinnedNotes = () => {
  useScrollToTop();
  const { getPinnedNotes } = useStore();
  const pinnedNotes = getPinnedNotes();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Pin className="h-8 w-8 text-orange-500 mr-3" />
              Pinned Notes
            </h1>
            <p className="text-gray-600 mt-2">Your most important notes, always at the top</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search pinned notes..." 
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        {pinnedNotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                    <Pin className="h-4 w-4 text-orange-500 flex-shrink-0 ml-2" />
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
          <div className="text-center py-16">
            <Pin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No pinned notes yet</h3>
            <p className="text-gray-500 mb-6">Pin your important notes to keep them easily accessible</p>
            <Link to="/dashboard">
              <Button>Browse Notes</Button>
            </Link>
          </div>
        )}
      </div>
      <VoiceAssistant 
        pageContext="I can help you manage your pinned notes, find specific content, or suggest organization strategies."
      />
    </DashboardLayout>
  );
};

export default PinnedNotes;
