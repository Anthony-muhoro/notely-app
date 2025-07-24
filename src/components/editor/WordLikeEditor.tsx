
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

  // Initialize editor content only once when value changes from empty to non-empty
  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleFormatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  }, [onChange]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.style.cssText = `
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
          margin: 8px 0;
          cursor: pointer;
          resize: both;
          overflow: hidden;
          border: 2px solid transparent;
        `;
        
        img.draggable = true;
        img.contentEditable = 'false';
        
        // Add selection styling
        img.addEventListener('click', (e) => {
          e.preventDefault();
          // Remove previous selections
          const prevSelected = editorRef.current?.querySelectorAll('img[data-selected="true"]');
          prevSelected?.forEach(prevImg => {
            prevImg.style.border = '2px solid transparent';
            prevImg.removeAttribute('data-selected');
          });
          
          // Select current image
          img.style.border = '2px solid #3b82f6';
          img.setAttribute('data-selected', 'true');
          
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            const range = document.createRange();
            range.selectNode(img);
            selection.addRange(range);
          }
        });

        // Handle resize
        img.addEventListener('mousedown', (e) => {
          if (e.target === img) {
            e.preventDefault();
          }
        });

        // Insert at cursor position or at the end
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
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedImg = range.commonAncestorContainer.parentElement?.querySelector('img[data-selected="true"]');
        
        if (selectedImg) {
          selectedImg.remove();
          onChange(editorRef.current?.innerHTML || '');
          event.preventDefault();
        }
      }
    }
  }, [onChange]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    // Deselect images when clicking elsewhere
    const selectedImgs = editorRef.current?.querySelectorAll('img[data-selected="true"]');
    selectedImgs?.forEach(img => {
      img.style.border = '2px solid transparent';
      img.removeAttribute('data-selected');
    });
  }, []);

  return (
    <Card className="overflow-hidden">
      <RichTextToolbar
        onFormatText={handleFormatText}
        onImageUpload={handleImageUpload}
      />
      
      <div className="min-h-[600px] bg-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          className="min-h-[600px] p-8 focus:outline-none prose prose-lg max-w-none"
          style={{
            lineHeight: '1.6',
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
            direction: 'ltr',
            textAlign: 'left',
          }}
          suppressContentEditableWarning={true}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
};

export default WordLikeEditor;
