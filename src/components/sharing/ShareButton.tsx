
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  note?: any;
  className?: string;
}

export const ShareButton = ({ note, className }: ShareButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className}`}
      disabled
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
};

export default ShareButton;
