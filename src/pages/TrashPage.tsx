import { Trash2, Calendar, RotateCcw, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ApiClient from "@/lib/api";

type Note = {
  id: string;
  title: string;
  synopsis: string;
  deletedAt: string;
};

const TrashPage = () => {
  useScrollToTop();
  const queryClient = useQueryClient();

  const { data: deletedNotes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["deleted-notes"],
    queryFn: async () => {
      const res = await ApiClient.get("/notes/deleted-notes");
      return res.data.notes;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await ApiClient.put(`/notes/${id}/restore`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Note restored");
      queryClient.invalidateQueries({ queryKey: ["deleted-notes"] });
    },
    onError: () => {
      toast.error("Failed to restore note");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await ApiClient.delete(`/notes/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Note permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["deleted-notes"] });
    },
    onError: () => {
      toast.error("Delete failed");
    },
  });

  const getDaysAgo = (deletedAt: string) => {
    const diff = Date.now() - new Date(deletedAt).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const TrashSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="opacity-75 border-dashed border-gray-300">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="h-8 flex-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Trash2 className="h-8 w-8 text-orange-500 mr-3" />
              Trash
            </h1>
            <p className="text-gray-600 mt-2">
              Items will be permanently deleted after 30 days
            </p>
          </div>
        </div>

        {deletedNotes.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 mt-px text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-800">
                Notes in trash are auto-deleted after 30 days. Restore before
                then.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <TrashSkeleton />
        ) : deletedNotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deletedNotes.map((note) => (
              <Card
                key={note.id}
                className="opacity-80 hover:opacity-100 transition-opacity border-dashed border-gray-300"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 text-gray-700">
                    {note.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                    {note.synopsis}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Deleted {getDaysAgo(note.deletedAt)} days ago
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreMutation.mutate(note.id)}
                      className="flex-1 hover:bg-green-50 hover:border-green-300"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <X className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border border-gray-200 shadow-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900">
                            Delete permanently?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600">
                            This cannot be undone. Delete “{note.title}”
                            forever?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-50 hover:bg-gray-100 border-gray-300">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(note.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="max-w-md mx-auto">
              <Trash2 className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">
                No notes in trash
              </h3>
              <p className="text-gray-500 text-lg">
                Deleted notes will appear here. You can restore or delete
                permanently.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrashPage;
