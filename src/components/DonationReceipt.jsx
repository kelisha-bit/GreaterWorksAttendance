import React, { useState, useEffect } from 'react';
import '../styles/receipt.css';
import { format } from 'date-fns';
import { Church, X, Download, Printer, Mail, Share2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DonationReceipt = ({ contribution, receiptNumber, onClose, onPrint, onDownload, showModal = true }) => {
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [useThemedTemplate, setUseThemedTemplate] = useState(true);

  if (!contribution) return null;

  // Load template when component mounts or contribution changes
  useEffect(() => {
    const loadTemplate = async () => {
      if (!useThemedTemplate || !contribution?.contributionType) {
        setTemplate(null);
        return;
      }
      
      try {
        const templateModule = await import('../utils/receiptTemplates');
        const templateData = templateModule.getReceiptTemplate(contribution.contributionType, contribution);
        setTemplate(templateData);
      } catch (error) {
        console.error('Error loading template:', error);
        setTemplate(null);
      }
    };
    
    loadTemplate();
  }, [contribution?.contributionType, useThemedTemplate]);

  const [template, setTemplate] = useState(null);

  // Track receipt generation when component mounts
  useEffect(() => {
    const trackReceipt = async () => {
      try {
        const { trackReceiptGeneration } = await import('../utils/receiptTracker');
        const receiptData = {
          receiptNumber: receiptNumber || `RC-${contribution.id?.substring(0, 6) || '000000'}`,
          contributionId: contribution.id,
          memberId: contribution.memberId,
          memberName: contribution.memberName,
          amount: contribution.amount,
          contributionType: contribution.contributionType,
          paymentMethod: contribution.paymentMethod,
          date: contribution.date,
          notes: contribution.notes,
          generatedBy: contribution.recordedBy || 'system'
        };
        
        const tracking = await trackReceiptGeneration(receiptData);
        setTrackingId(tracking.trackingId);
      } catch (error) {
        console.error('Error tracking receipt:', error);
      }
    };

    if (contribution.id) {
      trackReceipt();
    }
  }, [contribution, receiptNumber]);

  // Safely format the date
  const formatDate = (dateValue) => {
    try {
      // Handle Firestore Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        return format(dateValue.toDate(), 'MMMM d, yyyy');
      }
      // Handle Date object
      else if (dateValue instanceof Date) {
        return format(dateValue, 'MMMM d, yyyy');
      }
      // Handle string date
      else if (typeof dateValue === 'string') {
        return format(new Date(dateValue), 'MMMM d, yyyy');
      }
      // Fallback
      return format(new Date(), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return format(new Date(), 'MMMM d, yyyy');
    }
  };

  const handleEmailReceipt = async () => {
    setIsEmailing(true);
    try {
      const { sendReceiptEmail, getMemberEmail } = await import('../utils/emailService');
      
      // Try to get member email from contribution data or member list
      const recipientEmail = contribution.email || 
                           contribution.memberEmail || 
                           contribution.contactEmail;
      
      if (!recipientEmail) {
        toast.error('No email address found for this donor');
        return;
      }
      
      // Create receipt data object
      const receiptData = {
        receiptNumber: receiptNumber || `RC-${contribution.id?.substring(0, 6) || '000000'}`,
        memberName: contribution.memberName,
        memberId: contribution.memberId,
        amount: contribution.amount,
        contributionType: contribution.contributionType,
        paymentMethod: contribution.paymentMethod,
        date: contribution.date,
        notes: contribution.notes,
        generatedAt: new Date().toISOString(),
        generatedBy: contribution.recordedBy || 'system'
      };
      
      await sendReceiptEmail(receiptData, recipientEmail);
      setEmailSent(true);
      toast.success('Receipt sent successfully!');
      
      // Track email delivery
      if (trackingId) {
        try {
          const { markReceiptEmailed } = await import('../utils/receiptTracker');
          await markReceiptEmailed(trackingId, recipientEmail);
        } catch (trackingError) {
          console.error('Error tracking email delivery:', trackingError);
        }
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send receipt');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleShareReceipt = async () => {
    try {
      const shareMethod = navigator.share ? 'native' : 'clipboard';
      
      if (navigator.share) {
        await navigator.share({
          title: 'Donation Receipt',
          text: `Donation receipt for ${contribution.memberName} - Amount: ${contribution.amount}`,
          url: window.location.href
        });
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Receipt link copied to clipboard');
      }
      
      // Track sharing
      if (trackingId) {
        try {
          const { markReceiptShared } = await import('../utils/receiptTracker');
          await markReceiptShared(trackingId, shareMethod);
        } catch (trackingError) {
          console.error('Error tracking receipt sharing:', trackingError);
        }
      }
    } catch (error) {
      toast.error('Failed to share receipt');
    }
  };

  const handlePrintReceipt = async () => {
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Donation Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .receipt-container { max-width: 600px; margin: 0 auto; }
              .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
              .receipt-logo { width: 60px; height: 60px; background: #D4AF37; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
              .receipt-church-info h2 { font-size: 28px; font-weight: bold; color: #B8860B; margin-bottom: 5px; }
              .receipt-title { color: #666; font-size: 18px; }
              .receipt-number { display: flex; justify-content: space-between; margin-top: 10px; font-family: monospace; }
              .receipt-donor-info, .receipt-donation-details { margin-bottom: 30px; }
              .receipt-donor-info h3, .receipt-donation-details h3 { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .receipt-table { width: 100%; border-collapse: collapse; }
              .receipt-table th, .receipt-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .receipt-table th { background: #f5f5f5; font-weight: 600; }
              .receipt-footer { text-align: center; padding: 30px 0; border-top: 1px solid #ddd; }
              .receipt-signature { margin-top: 20px; }
              .signature-line { border-bottom: 1px solid #333; height: 1px; width: 200px; margin: 0 auto 10px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${receiptContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
      // Track printing
      if (trackingId) {
        try {
          const { markReceiptPrinted } = await import('../utils/receiptTracker');
          await markReceiptPrinted(trackingId);
        } catch (trackingError) {
          console.error('Error tracking receipt printing:', trackingError);
        }
      }
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const { exportReceiptAsPDF } = await import('../utils/pdfExport');
      const filename = `donation-receipt-${contribution.memberName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      await exportReceiptAsPDF('receipt-content', filename);
      toast.success('Receipt downloaded successfully');
      
      // Track download
      if (trackingId) {
        try {
          const { markReceiptDownloaded } = await import('../utils/receiptTracker');
          await markReceiptDownloaded(trackingId);
        } catch (trackingError) {
          console.error('Error tracking receipt download:', trackingError);
        }
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try printing instead.');
    }
  };

  const receiptContent = (
    <div className="receipt-container" id="receipt-content">
      <div className="receipt-header">
        <div className="receipt-logo">
          <Church size={40} />
        </div>
        <div className="receipt-church-info">
          <h2>Greater Works Church</h2>
          <p>123 Faith Avenue, Worship City</p>
          <p>Phone: (123) 456-7890</p>
        </div>
      </div>
      
      <div className="receipt-title">
        <h1>Donation Receipt</h1>
        <div className="receipt-number">
          <span>Receipt #: {receiptNumber || `RC-${contribution.id?.substring(0, 6) || '000000'}`}</span>
          <span>Date: {formatDate(contribution.date)}</span>
        </div>
      </div>
      
      <div className="receipt-donor-info">
        <h3>Donor Information</h3>
        <p><strong>Name:</strong> {contribution.memberName || 'N/A'}</p>
        <p><strong>ID:</strong> {contribution.memberId || 'N/A'}</p>
      </div>
      
      <div className="receipt-donation-details">
        <h3>Donation Details</h3>
        <table className="receipt-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{contribution.contributionType || 'Donation'}</td>
              <td>${isNaN(parseFloat(contribution.amount)) ? '0.00' : parseFloat(contribution.amount).toFixed(2)}</td>
            </tr>
            {contribution.notes && (
              <tr>
                <td colSpan="2" className="receipt-notes">
                  <strong>Notes:</strong> {contribution.notes}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>${isNaN(parseFloat(contribution.amount)) ? '0.00' : parseFloat(contribution.amount).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="receipt-footer">
        <p>Thank you for your generous contribution!</p>
        <p className="receipt-tax-info">This receipt is an important document. Please retain it for tax purposes.</p>
        <div className="receipt-signature">
          <div className="signature-line"></div>
          <p>Authorized Signature</p>
        </div>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="print-actions flex justify-center space-x-4 p-4 bg-gray-50 border-t">
      <button
        onClick={onPrint || handlePrintReceipt}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Printer className="w-4 h-4" />
        <span>Print</span>
      </button>
      <button
        onClick={onDownload || handleDownloadReceipt}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Download</span>
      </button>
      <button
        onClick={handleEmailReceipt}
        disabled={isEmailing}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {isEmailing ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : emailSent ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        <span>{emailSent ? 'Sent!' : isEmailing ? 'Sending...' : 'Email'}</span>
      </button>
      <button
        onClick={handleShareReceipt}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>
    </div>
  );

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Donation Receipt</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {receiptContent}
          {actionButtons}
        </div>
      </div>
    );
  }

  return (
    <div>
      {receiptContent}
      {actionButtons}
    </div>
  );
};

export default DonationReceipt;