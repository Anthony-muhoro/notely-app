import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  BookOpen,
  Edit3,
  Trash2,
  MoreHorizontal,
  Clock,
  Calendar,
  Globe,
  Lock,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  synopsis?: string;
  content: string;
  isPublic: boolean;
  dateCreated: string;
  lastUpdated: string;
}

interface NoteCardProps {
  note: Note;
  onView: (noteId: string) => void;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export function NoteCard({ note, onView, onEdit, onDelete }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle
              className="text-lg line-clamp-2 cursor-pointer hover:text-orange-500 transition-colors duration-200 group-hover:text-orange-600"
              onClick={() => onView(note.id)}
            >
              {note.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-3">
              <Badge
                variant="secondary"
                className={`flex items-center gap-1 ${
                  note.isPublic
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {note.isPublic ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {note.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(note.id)}>
                <BookOpen className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(note.id)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will move the note to trash. You can restore
                      it later if needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(note.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {note.synopsis || "No description available"}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(note.dateCreated)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated {formatDate(note.lastUpdated)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
