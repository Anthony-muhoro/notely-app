
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Palette,
  Type
} from "lucide-react";

interface RichTextToolbarProps {
  onFormatText: (command: string, value?: string) => void;
  onImageUpload: () => void;
}

const RichTextToolbar = ({ onFormatText, onImageUpload }: RichTextToolbarProps) => {
  const textColors = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Orange", value: "#f97316" },
  ];

  const highlightColors = [
    { name: "Yellow", value: "#fef08a" },
    { name: "Green", value: "#bbf7d0" },
    { name: "Blue", value: "#bfdbfe" },
    { name: "Pink", value: "#fbcfe8" },
    { name: "Purple", value: "#e9d5ff" },
  ];

  return (
    <div className="border-b bg-white p-3 sticky top-0 z-10 shadow-sm">
      <div className="flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('underline')}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Text Color</p>
              <div className="grid grid-cols-3 gap-2">
                {textColors.map((color) => (
                  <Button
                    key={color.name}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-full justify-start gap-2"
                    onClick={() => onFormatText('foreColor', color.value)}
                  >
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs">{color.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Highlight</p>
              <div className="grid grid-cols-3 gap-2">
                {highlightColors.map((color) => (
                  <Button
                    key={color.name}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-full justify-start gap-2"
                    onClick={() => onFormatText('backColor', color.value)}
                  >
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs">{color.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('justifyLeft')}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('justifyCenter')}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('justifyRight')}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFormatText('insertOrderedList')}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onImageUpload}
          className="h-8 w-8 p-0"
        >
          <Image className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RichTextToolbar;
