import { Globe, Calendar, User, Eye, Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

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

const getUserInitials = (
  firstName?: string,
  lastName?: string,
  userName?: string
) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (userName) {
    return userName.substring(0, 2).toUpperCase();
  }
  return "U";
};

const getUserDisplayName = (
  firstName?: string,
  lastName?: string,
  userName?: string
) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return userName || "Anonymous User";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
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
      const response = await ApiClient.get<ApiResponse>("/notes/public");
      console.log(response.data);
      return response.data;
    },
  });

  const notes = apiResponse?.data || [];

  const publicNotes = Array.isArray(notes)
    ? notes.filter((note) => note.isPublic)
    : [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <Globe className="h-16 w-16 text-orange-200 mx-auto mb-4" />
                <div className="absolute inset-0 animate-ping">
                  <Globe className="h-16 w-16 text-orange-400 mx-auto opacity-75" />
                </div>
              </div>
              <p className="text-gray-600 text-lg">
                Discovering amazing notes...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center py-16 border-red-100 bg-red-50/30">
            <CardContent>
              <Globe className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't load the public notes right now. Please check your
                connection and try again.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mb-4 shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Community Notes
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore knowledge and insights shared by our creative community
            </p>
          </div>
        </div>

        {publicNotes.length === 0 ? (
          <Card className="text-center py-20 border-dashed border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Globe className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                No public notes yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                Be a pioneer! Share the first note with our growing community
                and inspire others.
              </p>
              <Button
                onClick={() => navigate("/new")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg"
              >
                Create Public Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 mb-8 border border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {publicNotes.length}
                      </p>
                      <p className="text-sm text-gray-600">Public Notes</p>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-orange-200 text-orange-800 px-3 py-1"
                >
                  Community Shared
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {publicNotes.map((note) => (
                <Card
                  key={note.id}
                  className="group hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-10 w-10 ring-2 ring-orange-100 group-hover:ring-orange-200 transition-all duration-200">
                        <AvatarImage
                          src={note.user?.avatar || undefined}
                          alt={getUserDisplayName(
                            note.user?.firstName,
                            note.user?.lastName,
                            note.user?.userName
                          )}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-sm">
                          {getUserInitials(
                            note.user?.firstName,
                            note.user?.lastName,
                            note.user?.userName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getUserDisplayName(
                            note.user?.firstName,
                            note.user?.lastName,
                            note.user?.userName
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.dateCreated).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <CardTitle className="text-lg font-semibold line-clamp-2 text-gray-900 group-hover:text-orange-700 transition-colors duration-200">
                      {note.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6 leading-relaxed">
                      {note.synopsis ||
                        "This note contains valuable insights and information shared by the community."}
                    </p>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-orange-700 transition-all duration-200 font-medium"
                      onClick={() => navigate(`/note/${note.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Read Note
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Loving what you see?
                </h3>
                <p className="text-gray-600 mb-6">
                  Join our community and start sharing your own insights
                </p>
                <Button
                  onClick={() => navigate("/new")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
                >
                  Share Your Note
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <VoiceAssistant assistantType="default" />
    </DashboardLayout>
  );
};

export default PublicNotes;
