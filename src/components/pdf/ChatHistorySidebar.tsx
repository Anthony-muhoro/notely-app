import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ApiClient from "@/lib/api";

interface ChatSession {
  id: string;
  dateCreated: string;
  lastUpdated: string;
  messages: Array<{
    id: string;
    content: string;
    role: string;
  }>;
  _count?: {
    messages: number;
  };
}

interface ChatHistorySidebarProps {
  pdfId: string;
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

const ChatHistorySidebar = ({
  pdfId,
  currentSessionId,
  onSessionSelect,
  onNewChat,
}: ChatHistorySidebarProps) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query for sessions
  const {
    data: sessions = [],
    isLoading,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ["pdf-chat-sessions", pdfId],
    queryFn: async () => {
      const response = await ApiClient.get(`/pdfs/${pdfId}/chat/sessions`);
      return response.data.data || [];
    },
    enabled: !!pdfId,
    staleTime: 5000, // Cache for 5 seconds
    refetchOnWindowFocus: true,
  });

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(sessionId);
      await ApiClient.delete(`/pdfs/${pdfId}/chat/sessions/${sessionId}`);
      
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ["pdf-chat-sessions", pdfId] });
      const { data: updatedSessions } = await refetchSessions();
      
      // If deleted session was current, switch to most recent
      if (sessionId === currentSessionId) {
        const remainingSessions = (updatedSessions || []).filter((s: ChatSession) => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          onSessionSelect(remainingSessions[0].id);
        } else {
          // No more sessions, create a new one
          onNewChat();
        }
      }
      
      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting chat session:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreview = (session: ChatSession) => {
    if (session.messages && session.messages.length > 0) {
      const firstMessage = session.messages[0];
      const preview = firstMessage.content.substring(0, 60);
      return preview + (firstMessage.content.length > 60 ? "..." : "");
    }
    // This shouldn't happen since backend filters empty chats, but fallback
    return "Chat";
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-gray-900">Chat History</h3>
          </div>
          <Button
            onClick={onNewChat}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <p className="text-xs text-gray-600">
          {sessions.length} {sessions.length === 1 ? "conversation" : "conversations"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium mb-2">No chat history</p>
            <p className="text-sm">Start a new conversation to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`
                  relative group p-3 rounded-lg border cursor-pointer transition-all
                  ${
                    currentSessionId === session.id
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getPreview(session)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(session.lastUpdated)}</span>
                      {session._count && (
                        <>
                          <span>•</span>
                          <span>{session._count.messages} messages</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isDeleting === session.id}
                  >
                    {isDeleting === session.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default ChatHistorySidebar;
