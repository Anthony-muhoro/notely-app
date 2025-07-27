
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, RotateCcw } from "lucide-react";

interface TrashCardProps {
  note: {
    id: string;
    title: string;
    synopsis: string;
    deletedAt: string;
  };
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}

const TrashCard = ({ note, onRestore, onDelete, isRestoring, isDeleting }: TrashCardProps) => {
  const getDaysAgo = (deletedAt: string) => {
    const diff = Date.now() - new Date(deletedAt).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="opacity-80 hover:opacity-100 transition-all duration-200 border-gray-200 shadow-md hover:shadow-lg">
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
        <div className="flex">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(note.id)}
            className="w-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
            disabled={isRestoring}
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            {isRestoring ? "Restoring..." : "Restore"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrashCard;
