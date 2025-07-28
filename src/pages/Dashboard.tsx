import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, Search, FileText, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { NoteCard } from "@/components/dashboard/NoteCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { NoteCardSkeleton } from "@/components/ui/note-card-skeleton";

const Dashboard = () => {
  useScrollToTop();
  const navigate = useNavigate();

  const {
    data: notes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["get-notes"],
    queryFn: async () => {
      const response = await ApiClient.get("/notes");
      return response.data.data.notes;
    },
  });

  const handleDeleteNote = async (noteId: string) => {
    try {
      await ApiClient.delete(`/notes/${noteId}`);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleViewNote = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleEditNote = (noteId: string) => {
    navigate(`/edit/${noteId}`);
  };

  const statsData = [
    {
      title: "Total Notes",
      value: notes.length,
      description: "All your notes",
      icon: FileText,
      color: "bg-orange-500",
    },
    {
      title: "Public Notes",
      value: notes.filter((n: any) => n.isPublic).length,
      description: "Shared with community",
      icon: Globe,
      color: "bg-green-500",
    },
    {
      title: "Private Notes",
      value: notes.filter((n: any) => !n.isPublic).length,
      description: "Personal notes",
      icon: Lock,
      color: "bg-blue-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your notes and organize your thoughts
            </p>
          </div>
          <Button
            onClick={() => navigate("/new")}
            className="bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Recent Notes
            </h2>
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <NoteCardSkeleton key={i} />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <Card className="text-center py-12 border-0 shadow-lg">
              <CardContent>
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No notes yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first note to get started
                </p>
                <Button
                  onClick={() => navigate("/new")}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note: any) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onView={handleViewNote}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
