import { Globe, Calendar, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";

type Note = {
  id: string;
  title: string;
  synopsis?: string;
  content: string;
  isDeleted: boolean;
  creatorId: string;
  isPublic: boolean;
  isBookmarked: boolean;
  isPinned: boolean;
  dateCreated: string;
  lastUpdated: string;
  images: any[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    userName: string;
    avatar: string | null;
  };
};

type ApiResponse = {
  statusCode: number;
  data: {
    notes: Note[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
  success: boolean;
};

const PublicNotes = () => {
  useScrollToTop();
  const navigate = useNavigate();

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery<ApiResponse>({
    queryKey: ["get-public-notes"],
    queryFn: async () => {
      const response = await ApiClient.get<ApiResponse>("/notes");
      return response.data;
    },
  });

  // Extract notes from the API response
  const notes = apiResponse?.data?.notes || [];

  // Ensure notes is an array before filtering
  const publicNotes = Array.isArray(notes)
    ? notes.filter((note) => note.isPublic)
    : [];

  // Handle loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading public notes...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Error loading notes
              </h3>
              <p className="text-gray-600 mb-6">
                There was a problem loading the public notes. Please try again
                later.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Globe className="h-8 w-8 text-orange-500 mr-3" />
              Public Notes
            </h1>
            <p className="text-gray-600 mt-2">
              Discover notes shared by the community
            </p>
          </div>
        </div>

        {publicNotes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No public notes yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to share a note with the community
              </p>
              <Button
                onClick={() => navigate("/new")}
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
                    <CardTitle className="text-lg line-clamp-2">
                      {note.title}
                    </CardTitle>
                    <Globe className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700"
                    >
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
                      {note.user?.firstName && note.user?.lastName
                        ? `${note.user.firstName} ${note.user.lastName}`
                        : note.user?.userName || "Anonymous User"}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(note.dateCreated).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {/* Placeholder, replace with real view count if available */}
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
