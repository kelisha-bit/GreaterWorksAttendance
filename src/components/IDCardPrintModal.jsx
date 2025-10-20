import { useState } from 'react';
import { X, Printer, Download, Eye } from 'lucide-react';
import MemberIDCard from './MemberIDCard';
import '../styles/idcard.css';
import toast from 'react-hot-toast';

const IDCardPrintModal = ({ member, onClose }) => {
  const [showBack, setShowBack] = useState(false);
  const [printBothSides, setPrintBothSides] = useState(true);

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Please allow pop-ups to print ID cards');
      return;
    }

    // Build the HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Member ID Card - ${member.fullName}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 0;
              margin: 0;
            }

            @page {
              size: 3.375in 2.125in;
              margin: 0;
            }

            ${getIDCardStyles()}
          </style>
        </head>
        <body>
          ${document.getElementById('print-preview-content').innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };

    toast.success('Print dialog opened');
  };

  const handleDownloadPDF = () => {
    toast.info('PDF download feature coming soon!');
    // TODO: Implement PDF generation using jsPDF or similar
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Member ID Card</h2>
            <p className="text-sm text-gray-600">{member.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Options */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-back"
                checked={showBack}
                onChange={(e) => setShowBack(e.target.checked)}
                className="w-4 h-4 text-church-gold focus:ring-church-gold border-gray-300 rounded"
              />
              <label htmlFor="show-back" className="text-sm text-gray-700 cursor-pointer">
                Show back side
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="print-both"
                checked={printBothSides}
                onChange={(e) => setPrintBothSides(e.target.checked)}
                className="w-4 h-4 text-church-gold focus:ring-church-gold border-gray-300 rounded"
              />
              <label htmlFor="print-both" className="text-sm text-gray-700 cursor-pointer">
                Print both sides
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-8 bg-gray-100">
          <div className="flex justify-center items-center min-h-[600px] overflow-visible">
            <div id="print-preview-content" style={{ transform: 'scale(1)', transformOrigin: 'center' }}>
              <MemberIDCard member={member} showBack={printBothSides || showBack} />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Printing Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Use CR80 card stock (3.375" × 2.125") for best results</li>
                <li>Set printer to "Actual Size" or "100% scale"</li>
                <li>Enable "Print Background Graphics" in print settings</li>
                <li>For double-sided cards, print front first, then flip and print back</li>
                <li>Consider laminating for durability</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get ID card styles
function getIDCardStyles() {
  return `
    .id-card-container {
      display: flex;
      gap: 0.25in;
      flex-wrap: wrap;
      justify-content: center;
    }

    .id-card {
      width: 3.375in;
      height: 2.125in;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: always;
      break-after: page;
    }

    .id-card:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .id-card-front {
      display: flex;
      flex-direction: column;
      padding: 0.4in;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .id-card-header {
      display: flex;
      align-items: center;
      gap: 0.15in;
      margin-bottom: 0.15in;
      padding-bottom: 0.1in;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    }

    .logo-circle {
      width: 0.5in;
      height: 0.5in;
      background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .logo-text {
      font-size: 14pt;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -1px;
    }

    .church-name {
      font-size: 12pt;
      font-weight: 700;
      margin: 0;
      line-height: 1.1;
    }

    .church-subtitle {
      font-size: 8pt;
      margin: 0;
      opacity: 0.9;
      font-weight: 500;
    }

    .member-photo-section {
      display: flex;
      justify-content: center;
      margin-bottom: 0.12in;
    }

    .member-photo {
      width: 0.8in;
      height: 0.8in;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
    }

    .member-photo-placeholder {
      width: 0.8in;
      height: 0.8in;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .placeholder-initials {
      font-size: 16pt;
      font-weight: 700;
      color: #1e3a8a;
    }

    .member-details {
      text-align: center;
      margin-bottom: 0.12in;
    }

    .member-name {
      font-size: 11pt;
      font-weight: 700;
      margin: 0 0 0.05in 0;
      line-height: 1.2;
    }

    .member-id {
      font-size: 7pt;
      margin: 0 0 0.08in 0;
      opacity: 0.9;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
    }

    .member-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.05in;
      font-size: 6.5pt;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.08in;
      border-radius: 6px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      opacity: 0.8;
      font-weight: 500;
      font-size: 5.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .info-value {
      font-weight: 600;
      font-size: 7pt;
    }

    .qr-code-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.05in;
      margin-top: auto;
      padding: 0.08in;
      background: white;
      border-radius: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }

    .qr-label {
      font-size: 5.5pt;
      color: #1e3a8a;
      margin: 0;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .id-card-footer {
      text-align: center;
      margin-top: 0.08in;
      padding-top: 0.08in;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
    }

    .validity-text {
      font-size: 6pt;
      margin: 0;
      opacity: 0.8;
      font-weight: 500;
    }

    .id-card-back {
      display: flex;
      flex-direction: column;
      padding: 0.3in;
      background: white;
      color: #1e3a8a;
      gap: 0.12in;
    }

    .back-section-title {
      font-size: 8pt;
      font-weight: 700;
      margin: 0 0 0.06in 0;
      color: #1e3a8a;
      border-bottom: 1px solid #d4af37;
      padding-bottom: 0.04in;
    }

    .back-text {
      font-size: 6.5pt;
      margin: 0;
      line-height: 1.3;
      color: #374151;
    }

    .back-list {
      margin: 0;
      padding-left: 0.15in;
      font-size: 5.5pt;
      line-height: 1.4;
      color: #374151;
    }

    .back-list li {
      margin-bottom: 0.03in;
    }

    .signature-box {
      width: 1.5in;
      height: 0.3in;
      border-bottom: 1px solid #1e3a8a;
    }

    .signature-label {
      font-size: 5.5pt;
      color: #6b7280;
      margin: 0;
      font-style: italic;
    }

    .barcode-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.04in;
      padding: 0.08in;
      background: #f3f4f6;
      border-radius: 6px;
    }

    .barcode-placeholder {
      width: 100%;
      height: 0.25in;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 2px;
    }

    .barcode-lines {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 100%;
    }

    .barcode-line {
      width: 2px;
      background: #1e3a8a;
    }

    .barcode-text {
      font-size: 6pt;
      font-family: 'Courier New', monospace;
      color: #1e3a8a;
      margin: 0;
      font-weight: 600;
      letter-spacing: 1px;
    }

    @media print {
      @page {
        size: 3.375in 2.125in;
        margin: 0;
      }

      body {
        margin: 0;
        padding: 0;
      }

      .id-card {
        box-shadow: none;
        margin: 0;
      }
    }
  `;
}

export default IDCardPrintModal;
