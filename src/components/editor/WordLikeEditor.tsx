import { useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import RichTextToolbar from "./RichTextToolbar";

interface WordLikeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const WordLikeEditor = ({ value, onChange }: WordLikeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentContent = editorRef.current.innerHTML;

      if (currentContent !== value) {
        const selection = window.getSelection();
        let wasAtEnd = false;

        // Check if cursor was at the end before update
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editorRef.current);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          const currentCursorPos = preCaretRange.toString().length;
          const totalLength = editorRef.current.textContent?.length || 0;
          wasAtEnd = currentCursorPos >= totalLength;
        }

        // Update content
        editorRef.current.innerHTML = value;

        // Always move cursor to the end of new content, or maintain rightward flow
        try {
          if (editorRef.current.textContent || editorRef.current.innerHTML) {
            const range = document.createRange();
            const sel = window.getSelection();

            // Move cursor to the end of the content
            range.selectNodeContents(editorRef.current);
            range.collapse(false); // false = collapse to end

            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        } catch (error) {
          // Fallback: just focus the editor
          editorRef.current.focus();
        }
      }
    }
  }, [value]);

  const getTextNodes = (element: Node): Text[] => {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    return textNodes;
  };

  const handleFormatText = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      setTimeout(() => {
        if (editorRef.current) {
          isUpdatingRef.current = true;
          onChange(editorRef.current.innerHTML);
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 0);
        }
      }, 0);
    },
    [onChange]
  );

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.src = e.target?.result as string;
          img.className = "editor-image";
          img.draggable = true;
          img.contentEditable = "false";

          img.addEventListener("click", (e) => {
            e.preventDefault();
            const prevSelected = editorRef.current?.querySelectorAll(
              'img[data-selected="true"]'
            );
            prevSelected?.forEach((prevImg) => {
              const imgElement = prevImg as HTMLImageElement;
              imgElement.style.border = "2px solid transparent";
              imgElement.removeAttribute("data-selected");
            });

            img.style.border = "2px solid #3b82f6";
            img.setAttribute("data-selected", "true");

            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              const range = document.createRange();
              range.selectNode(img);
              selection.addRange(range);
            }
          });

          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(img);
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
          } else if (editorRef.current) {
            editorRef.current.appendChild(img);
          }

          if (editorRef.current) {
            isUpdatingRef.current = true;
            onChange(editorRef.current.innerHTML);
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 0);
          }
        };
        reader.readAsDataURL(file);
      }
      event.target.value = "";
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedImg =
            range.commonAncestorContainer.parentElement?.querySelector(
              'img[data-selected="true"]'
            );

          if (selectedImg) {
            selectedImg.remove();
            isUpdatingRef.current = true;
            onChange(editorRef.current?.innerHTML || "");
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 0);
            event.preventDefault();
          }
        }
      }
    },
    [onChange]
  );

  const handleContentChange = useCallback(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);

      // Ensure cursor direction is always left-to-right
      setTimeout(() => {
        if (editorRef.current) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            // Ensure the range direction is forward (left-to-right)
            if (range.collapsed) {
              range.collapse(false);
            }
          }
        }
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    const selectedImgs = editorRef.current?.querySelectorAll(
      'img[data-selected="true"]'
    );
    selectedImgs?.forEach((img) => {
      const imgElement = img as HTMLImageElement;
      imgElement.style.border = "2px solid transparent";
      imgElement.removeAttribute("data-selected");
    });
  }, []);

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <style>
        {`
          .editor-content {
            direction: ltr !important;
            text-align: start !important;
            unicode-bidi: bidi-override;
            writing-mode: horizontal-tb;
          }
          .editor-content:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
            direction: ltr;
            text-align: start;
          }
          .editor-content:focus:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            direction: ltr;
            text-align: start;
          }
          .editor-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            display: block;
            margin: 8px 0;
            cursor: pointer;
            resize: both;
            overflow: hidden;
            border: 2px solid transparent;
          }
          .editor-content * {
            direction: ltr !important;
            text-align: start !important;
            unicode-bidi: bidi-override !important;
          }
          .editor-content p {
            direction: ltr !important;
            text-align: start !important;
            unicode-bidi: bidi-override !important;
          }
          .editor-content span, .editor-content div, .editor-content strong, 
          .editor-content em, .editor-content u, .editor-content i {
            direction: ltr !important;
            text-align: start !important;
            unicode-bidi: bidi-override !important;
          }
        `}
      </style>
      <RichTextToolbar
        onFormatText={handleFormatText}
        onImageUpload={handleImageUpload}
      />

      <div className="bg-white relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          className="editor-content min-h-[500px] p-8 focus:outline-none prose prose-lg max-w-none transition-all duration-200"
          style={{
            lineHeight: "1.6",
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            direction: "ltr",
            textAlign: "start",
            unicodeBidi: "bidi-override",
            writingMode: "horizontal-tb",
          }}
          suppressContentEditableWarning={true}
          data-placeholder="Start writing your note..."
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image file"
      />
    </Card>
  );
};

export default WordLikeEditor;
