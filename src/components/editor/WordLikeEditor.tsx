
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
    // Let the browser handle cursor positioning naturally
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
        const imageId = `img-${Date.now()}`;
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container my-4';
        imageContainer.setAttribute('data-image-id', imageId);
        imageContainer.style.cssText = `
          position: relative;
          display: block;
          margin: 16px auto;
          max-width: 100%;
          text-align: center;
          border: 2px dashed #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          background: #f9fafb;
        `;
        
        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.style.cssText = `
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: block;
          margin: 0 auto 8px auto;
        `;
        
        const caption = document.createElement('div');
        caption.contentEditable = 'true';
        caption.style.cssText = `
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
          text-align: center;
          outline: none;
          padding: 4px;
          border: 1px solid transparent;
          border-radius: 4px;
        `;
        caption.innerText = 'Add a caption...';
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        
        removeBtn.onclick = (e) => {
          e.preventDefault();
          imageContainer.remove();
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        };
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(caption);
        imageContainer.appendChild(removeBtn);
        
        // Insert at cursor position or at the end
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(imageContainer);
          
          // Move cursor after the image
          range.setStartAfter(imageContainer);
          range.setEndAfter(imageContainer);
          selection.removeAllRanges();
          selection.addRange(range);
        } else if (editorRef.current) {
          editorRef.current.appendChild(imageContainer);
        }
        
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }, [onChange]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleDownloadPDF = useCallback(() => {
    console.log("Downloading as PDF...");
    // PDF download functionality would be implemented here
  }, []);

  const handleShare = useCallback(() => {
    console.log("Sharing note...");
    // Share functionality would be implemented here
  }, []);

  return (
    <Card className="overflow-hidden">
      <RichTextToolbar
        onFormatText={handleFormatText}
        onImageUpload={handleImageUpload}
        onDownloadPDF={handleDownloadPDF}
        onShare={handleShare}
      />
      
      <div className="min-h-[600px] bg-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
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
