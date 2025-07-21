
import { useState } from "react";
import { Trash2, Calendar, RotateCcw, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";

const TrashPage = () => {
  useScrollToTop();
  const { notes } = useStore();
  const { toast } = useToast();
  
  // Mock deleted notes for demo
  const [deletedNotes, setDeletedNotes] = useState([
    {
      id: "deleted-1",
      title: "Old Meeting Notes",
      synopsis: "Some old meeting notes that were deleted",
      deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      id: "deleted-2", 
      title: "Draft Ideas",
      synopsis: "Draft ideas that didn't make it",
      deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
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
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Notes in trash are automatically deleted after 30 days. Restore them now if you need them.
                </p>
              </div>
            </div>
          </div>
        )}

        {deletedNotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deletedNotes.map((note) => (
              <Card key={note.id} className="opacity-75 hover:opacity-100 transition-opacity border-dashed">
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
                      className="flex-1"
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
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the note "{note.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handlePermanentDelete(note.id)}
                            className="bg-red-500 hover:bg-red-600"
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
          <div className="text-center py-16">
            <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Trash is empty</h3>
            <p className="text-gray-500">Deleted notes will appear here</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrashPage;
