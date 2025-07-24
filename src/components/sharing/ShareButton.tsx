import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Download, MessageCircle, Facebook, Twitter, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateNotePDF } from "@/lib/pdfUtils";
import { useState } from "react";

interface ShareButtonProps {
  noteTitle: string;
  noteContent: string;
  noteId: string;
  synopsis?: string;
}

export function ShareButton({ 
  noteTitle, 
  noteContent, 
  noteId, 
  synopsis 
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateNotePDF({
        title: noteTitle,
        content: noteContent,
        synopsis,
      });
      toast({
        title: "PDF Downloaded",
        description: "Your note has been downloaded as a PDF.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`Check out this note: ${noteTitle} - ${window.location.origin}/note/${noteId}`)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/note/${noteId}`)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this note: ${noteTitle}`)}&url=${encodeURIComponent(`${window.location.origin}/note/${noteId}`)}`;
    window.open(url, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter}>
          <Twitter className="mr-2 h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
