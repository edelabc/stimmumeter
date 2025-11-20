import { Share2, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportShareProps {
  contentRef: React.RefObject<HTMLDivElement>;
  pseudonymName: string;
}

export function ExportShare({ contentRef, pseudonymName }: ExportShareProps) {
  const handlePDFExport = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`stimmung-${pseudonymName}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Fehler beim PDF-Export');
    }
  };

  const handleShare = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `stimmung-${pseudonymName}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Stimmungsbericht',
            text: `Stimmungsbericht für ${pseudonymName}`,
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stimmung-${pseudonymName}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Share Error:', error);
      alert('Teilen wird auf diesem Gerät nicht unterstützt. Bild wurde heruntergeladen.');
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handlePDFExport}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
      >
        <FileText size={18} />
        PDF Export
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors shadow-lg"
      >
        <Share2 size={18} />
        Teilen
      </button>
    </div>
  );
}
