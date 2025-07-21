import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  Image,
  Download,
  Share2,
  Palette,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => void;
}
const RichTextEditor = ({
  value,
  onChange,
  onImageUpload,
}: RichTextEditorProps) => {
  const [activeTab, setActiveTab] = useState("write");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const highlightColors = [
    { name: "Yellow", color: "bg-yellow-200", class: "highlight-yellow" },
    { name: "Green", color: "bg-green-200", class: "highlight-green" },
    { name: "Blue", color: "bg-blue-200", class: "highlight-blue" },
    { name: "Pink", color: "bg-pink-200", class: "highlight-pink" },
    { name: "Purple", color: "bg-purple-200", class: "highlight-purple" },
  ];
  const insertFormatting = (before: string, after: string = "") => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
      const imageMarkdown = `![${file.name}](image-placeholder-${Date.now()})`;
      insertFormatting(imageMarkdown);
    }
  };
  const applyHighlight = (colorClass: string) => {
    insertFormatting(`<mark class="${colorClass}">`, "</mark>");
  };
  const downloadAsPDF = () => {
    console.log("Downloading as PDF...");
  };
  const shareNote = () => {
    console.log("Sharing note...");
  };
  return (
    <Card>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting("**", "**")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting("*", "*")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting("<u>", "</u>")}
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="grid grid-cols-2 gap-2">
                    {highlightColors.map((color) => (
                      <Button
                        key={color.name}
                        size="sm"
                        variant="ghost"
                        className={`${color.color} hover:opacity-80`}
                        onClick={() => applyHighlight(color.class)}
                      >
                        {color.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting("- ")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting("1. ")}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" onClick={downloadAsPDF}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={shareNote}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="write" className="mt-0">
            <textarea
              ref={textAreaRef}
              placeholder="Start writing your note... Use the toolbar for formatting, highlighting, and more!"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={20}
              className="w-full p-6 border-0 resize-none focus:outline-none font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <div className="min-h-[500px] p-6">
              {value ? (
                <div className="prose max-w-none">
                  {value.split("\n").map((line, index) => {
                    let processedLine = line;
                    if (line.startsWith("### ")) {
                      return (
                        <h3
                          key={index}
                          className="text-xl font-medium mb-2 mt-4"
                        >
                          {line.slice(4)}
                        </h3>
                      );
                    }
                    if (line.startsWith("## ")) {
                      return (
                        <h2
                          key={index}
                          className="text-2xl font-semibold mb-3 mt-6"
                        >
                          {line.slice(3)}
                        </h2>
                      );
                    }
                    if (line.startsWith("# ")) {
                      return (
                        <h1
                          key={index}
                          className="text-3xl font-bold mb-4 mt-8"
                        >
                          {line.slice(2)}
                        </h1>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {line.slice(2)}
                        </li>
                      );
                    }
                    if (/^\d+\.\s/.test(line)) {
                      return (
                        <li key={index} className="ml-4 mb-1 list-decimal">
                          {line.replace(/^\d+\.\s/, "")}
                        </li>
                      );
                    }
                    processedLine = processedLine.replace(
                      /\*\*(.*?)\*\*/g,
                      "<strong>$1</strong>"
                    );
                    processedLine = processedLine.replace(
                      /\*(.*?)\*/g,
                      "<em>$1</em>"
                    );
                    processedLine = processedLine.replace(
                      /<u>(.*?)<\/u>/g,
                      "<u>$1</u>"
                    );
                    highlightColors.forEach((color) => {
                      processedLine = processedLine.replace(
                        new RegExp(
                          `<mark class="${color.class}">(.*?)</mark>`,
                          "g"
                        ),
                        `<mark class="bg-${color.color.replace(
                          "bg-",
                          ""
                        )}"">$1</mark>`
                      );
                    });
                    if (line.trim() === "") {
                      return <br key={index} />;
                    }
                    return (
                      <p
                        key={index}
                        className="mb-2"
                        dangerouslySetInnerHTML={{ __html: processedLine }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Preview will appear here...
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default RichTextEditor;
