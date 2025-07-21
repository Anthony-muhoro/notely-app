
import { Globe, Calendar, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";

const PublicNotes = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const { getPublicNotes } = useStore();
  
  const publicNotes = getPublicNotes();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Globe className="h-8 w-8 text-orange-500 mr-3" />
              Public Notes
            </h1>
            <p className="text-gray-600 mt-2">Discover notes shared by the community</p>
          </div>
        </div>

        {publicNotes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No public notes yet</h3>
              <p className="text-gray-600 mb-6">Be the first to share a note with the community</p>
              <Button 
                onClick={() => navigate('/new')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Create Public Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                    <Globe className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      Public
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {note.synopsis || "No description available"}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      Anonymous User
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {Math.floor(Math.random() * 500) + 10} views
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/note/${note.id}`)}
                  >
                    Read Note
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PublicNotes;
