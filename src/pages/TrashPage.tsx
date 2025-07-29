import { Trash2 } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import VoiceAssistant from "@/components/voice/VoiceAssistant";
import TrashCard from "@/components/trash/TrashCard";
import TrashSkeleton from "@/components/trash/TrashSkeleton";
import EmptyTrash from "@/components/trash/EmptyTrash";
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
      toast.success("Note restored successfully");
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
      toast.error("Failed to delete note");
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Trash2 className="h-8 w-8 text-orange-500 mr-3" />
              Trash
            </h1>
            <p className="text-gray-600 mt-2">Manage your deleted notes</p>
          </div>
        </div>

        {isLoading ? (
          <TrashSkeleton />
        ) : deletedNotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deletedNotes.map((note) => (
              <TrashCard
                key={note.id}
                note={note}
                onRestore={restoreMutation.mutate}
                onDelete={deleteMutation.mutate}
                isRestoring={restoreMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyTrash />
        )}
      </div>
      <VoiceAssistant assistantType="default" />
    </DashboardLayout>
  );
};

export default TrashPage;
