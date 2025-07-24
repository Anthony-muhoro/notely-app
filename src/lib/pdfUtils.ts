
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateNotePDF = async (noteData: {
  title: string;
  content: string;
  synopsis?: string;
}) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  // Title
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(noteData.title, contentWidth);
  pdf.text(titleLines, margin, margin + 10);
  
  let yPosition = margin + 10 + (titleLines.length * 8) + 20;
  
  // Synopsis
  if (noteData.synopsis) {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    const synopsisLines = pdf.splitTextToSize(noteData.synopsis, contentWidth);
    pdf.text(synopsisLines, margin, yPosition);
    yPosition += synopsisLines.length * 6 + 20;
  }
  
  // Create a temporary div to render HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = noteData.content;
  tempDiv.style.width = `${contentWidth * 2}px`; // Scale for better quality
  tempDiv.style.padding = '20px';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.fontSize = '14px';
  tempDiv.style.lineHeight = '1.6';
  
  // Style images in the temp div
  const images = tempDiv.querySelectorAll('img');
  images.forEach(img => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '10px 0';
  });
  
  document.body.appendChild(tempDiv);
  
  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add content as image
    if (yPosition + imgHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
    
    // Check if we need additional pages
    let remainingHeight = imgHeight;
    let currentY = yPosition;
    
    while (remainingHeight > pageHeight - margin - currentY) {
      pdf.addPage();
      remainingHeight -= (pageHeight - margin - currentY);
      currentY = margin;
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Fallback to text-only PDF
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const contentLines = pdf.splitTextToSize(textContent, contentWidth);
    
    for (let i = 0; i < contentLines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(contentLines[i], margin, yPosition);
      yPosition += 6;
    }
  } finally {
    document.body.removeChild(tempDiv);
  }
  
  // Save the PDF
  pdf.save(`${noteData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
};
