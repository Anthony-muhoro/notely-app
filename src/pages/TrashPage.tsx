
import { useState } from "react";
import { Trash2, Calendar, RotateCcw, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";

const TrashPage = () => {
  useScrollToTop();
  const { notes } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock deleted notes for demo
  const [deletedNotes, setDeletedNotes] = useState([
    {
      id: "deleted-1",
      title: "Old Meeting Notes",
      synopsis: "Some old meeting notes that were deleted",
      deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "deleted-2", 
      title: "Draft Ideas",
      synopsis: "Draft ideas that didn't make it",
      deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
  ]);

  const handleRestore = (noteId: string) => {
    setDeletedNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: "Note restored",
      description: "The note has been restored to your notes.",
    });
  };

  const handlePermanentDelete = (noteId: string) => {
    setDeletedNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: "Note permanently deleted",
      description: "The note has been permanently deleted and cannot be recovered.",
      variant: "destructive"
    });
  };

  const getDaysInTrash = (deletedAt: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const TrashSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="opacity-75 border-dashed">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-3/4 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
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
            <p className="text-gray-600 mt-2">Items will be permanently deleted after 30 days</p>
          </div>
        </div>

        {deletedNotes.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-orange-800">
                  Notes in trash are automatically deleted after 30 days. Restore them now if you need them.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <TrashSkeleton />
        ) : deletedNotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deletedNotes.map((note) => (
              <Card key={note.id} className="opacity-75 hover:opacity-100 transition-opacity border-dashed border-gray-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 text-gray-600">{note.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">{note.synopsis}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Deleted {getDaysInTrash(note.deletedAt)} days ago
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRestore(note.id)}
                      className="flex-1 hover:bg-green-50 hover:border-green-300"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="hover:bg-red-600">
                          <X className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white border border-gray-200 shadow-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900">Delete permanently?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600">
                            This action cannot be undone. This will permanently delete the note "{note.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-50 hover:bg-gray-100 border-gray-300">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handlePermanentDelete(note.id)}
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
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">No notes in trash</h3>
              <p className="text-gray-500 text-lg">When you delete notes, they'll appear here where you can restore or permanently delete them.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrashPage;
