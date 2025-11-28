import React, { useState } from 'react';
import { FileText, Mail, Download, CheckCircle, AlertCircle, Users, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const BatchReceiptGenerator = ({ contributions, members, onClose }) => {
  const [selectedContributions, setSelectedContributions] = useState([]);
  const [batchAction, setBatchAction] = useState('download');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  // Handle contribution selection
  const handleToggleContribution = (contribution) => {
    setSelectedContributions(prev => {
      const isSelected = prev.some(c => c.id === contribution.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contribution.id);
      } else {
        return [...prev, contribution];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedContributions.length === contributions.length) {
      setSelectedContributions([]);
    } else {
      setSelectedContributions([...contributions]);
    }
  };

  // Process batch action
  const handleBatchProcess = async () => {
    if (selectedContributions.length === 0) {
      toast.error('Please select at least one contribution');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      const results = {
        total: selectedContributions.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < selectedContributions.length; i++) {
        const contribution = selectedContributions[i];
        
        try {
          if (batchAction === 'download') {
            await handleDownloadReceipt(contribution);
          } else if (batchAction === 'email') {
            await handleEmailReceipt(contribution);
          } else if (batchAction === 'print') {
            await handlePrintReceipt(contribution);
          }
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            contribution: contribution.memberName,
            error: error.message
          });
        }

        setProgress(Math.round(((i + 1) / selectedContributions.length) * 100));
        
        // Add small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults(results);
      
      if (results.success > 0) {
        toast.success(`Successfully processed ${results.success} receipts`);
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to process ${results.failed} receipts`);
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      toast.error('Batch processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Individual receipt handlers
  const handleDownloadReceipt = async (contribution) => {
    const { exportReceiptAsPDF } = await import('../utils/pdfExport');
    const { generateTypedReceiptNumber } = await import('../utils/receiptUtils');
    const { trackReceiptGeneration, markReceiptDownloaded } = await import('../utils/receiptTracker');
    
    const receiptNumber = contribution.receiptNumber || generateTypedReceiptNumber(contribution);
    const filename = `donation-receipt-${contribution.memberName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Track receipt generation
    const tracking = await trackReceiptGeneration({
      receiptNumber,
      contributionId: contribution.id,
      memberId: contribution.memberId,
      memberName: contribution.memberName,
      amount: contribution.amount,
      contributionType: contribution.contributionType,
      paymentMethod: contribution.paymentMethod,
      date: contribution.date,
      notes: contribution.notes,
      generatedBy: 'batch-system'
    });
    
    // Create temporary receipt element for export
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateReceiptHTML(contribution, receiptNumber);
    tempDiv.id = `temp-receipt-${contribution.id}`;
    document.body.appendChild(tempDiv);
    
    try {
      await exportReceiptAsPDF(tempDiv.id, filename);
      await markReceiptDownloaded(tracking.trackingId);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleEmailReceipt = async (contribution) => {
    const { sendReceiptEmail } = await import('../utils/emailService');
    const { generateTypedReceiptNumber } = await import('../utils/receiptUtils');
    const { trackReceiptGeneration, markReceiptEmailed } = await import('../utils/receiptTracker');
    
    const recipientEmail = contribution.email || contribution.memberEmail || contribution.contactEmail;
    
    if (!recipientEmail) {
      throw new Error('No email address found');
    }
    
    const receiptNumber = contribution.receiptNumber || generateTypedReceiptNumber(contribution);
    
    // Track receipt generation
    const tracking = await trackReceiptGeneration({
      receiptNumber,
      contributionId: contribution.id,
      memberId: contribution.memberId,
      memberName: contribution.memberName,
      amount: contribution.amount,
      contributionType: contribution.contributionType,
      paymentMethod: contribution.paymentMethod,
      date: contribution.date,
      notes: contribution.notes,
      generatedBy: 'batch-system'
    });
    
    const receiptData = {
      receiptNumber,
      memberName: contribution.memberName,
      memberId: contribution.memberId,
      amount: contribution.amount,
      contributionType: contribution.contributionType,
      paymentMethod: contribution.paymentMethod,
      date: contribution.date,
      notes: contribution.notes,
      generatedAt: new Date().toISOString(),
      generatedBy: 'batch-system'
    };
    
    await sendReceiptEmail(receiptData, recipientEmail);
    await markReceiptEmailed(tracking.trackingId, recipientEmail);
  };

  const handlePrintReceipt = async (contribution) => {
    const { generateTypedReceiptNumber } = await import('../utils/receiptUtils');
    const { trackReceiptGeneration, markReceiptPrinted } = await import('../utils/receiptTracker');
    
    const receiptNumber = contribution.receiptNumber || generateTypedReceiptNumber(contribution);
    
    // Track receipt generation
    const tracking = await trackReceiptGeneration({
      receiptNumber,
      contributionId: contribution.id,
      memberId: contribution.memberId,
      memberName: contribution.memberName,
      amount: contribution.amount,
      contributionType: contribution.contributionType,
      paymentMethod: contribution.paymentMethod,
      date: contribution.date,
      notes: contribution.notes,
      generatedBy: 'batch-system'
    });
    
    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Donation Receipt - ${contribution.memberName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${generateReceiptHTML(contribution, receiptNumber)}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    await markReceiptPrinted(tracking.trackingId);
  };

  // Generate receipt HTML
  const generateReceiptHTML = (contribution, receiptNumber) => {
    return `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: #D4AF37; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">GW</div>
          <h2 style="font-size: 28px; font-weight: bold; color: #B8860B; margin: 0;">Greater Works Church</h2>
          <p style="margin: 5px 0; color: #666;">123 Faith Avenue, Worship City</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0; color: #333;">Donation Receipt</h1>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-family: monospace;">
            <span>Receipt #: ${receiptNumber}</span>
            <span>Date: ${new Date(contribution.date).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 10px;">DONOR INFORMATION</h3>
          <p><strong>Name:</strong> ${contribution.memberName}</p>
          <p><strong>ID:</strong> ${contribution.memberId}</p>
        </div>
        
        <div style="background: #fef7e0; padding: 20px; border-radius: 8px; border: 2px solid #D4AF37; margin-bottom: 30px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #B8860B; margin-bottom: 10px;">DONATION DETAILS</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${contribution.contributionType}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${parseFloat(contribution.amount).toFixed(2)} GHS</td>
            </tr>
            ${contribution.notes ? `
              <tr>
                <td colspan="2" style="padding: 8px; font-size: 12px; color: #666;">
                  <strong>Notes:</strong> ${contribution.notes}
                </td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px; color: #B8860B;">${parseFloat(contribution.amount).toFixed(2)} GHS</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; padding: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; color: #666;">Thank you for your generous contribution!</p>
          <p style="margin: 5px 0; font-size: 12px; color: #999;">This receipt is an important document. Please retain it for tax purposes.</p>
        </div>
      </div>
    `;
  };

  // Calculate statistics
  const totalAmount = selectedContributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const totalContributions = selectedContributions.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Batch Receipt Generator</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate multiple receipts at once
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Selected Contributions</p>
                  <p className="text-2xl font-bold text-blue-900">{totalContributions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-900">
                    {totalAmount.toFixed(2)} GHS
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Action</p>
                  <p className="text-lg font-bold text-purple-900 capitalize">{batchAction}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Action
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setBatchAction('download')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  batchAction === 'download'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Download className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Download PDFs</p>
                <p className="text-sm text-gray-600">Generate and download receipt PDFs</p>
              </button>
              
              <button
                onClick={() => setBatchAction('email')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  batchAction === 'email'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Mail className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Send Emails</p>
                <p className="text-sm text-gray-600">Email receipts to donors</p>
              </button>
              
              <button
                onClick={() => setBatchAction('print')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  batchAction === 'print'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Print Receipts</p>
                <p className="text-sm text-gray-600">Open print dialogs for receipts</p>
              </button>
            </div>
          </div>

          {/* Contributions List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Contributions</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedContributions.length === contributions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {contributions.map(contribution => (
                <div
                  key={contribution.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedContributions.some(c => c.id === contribution.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleToggleContribution(contribution)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedContributions.some(c => c.id === contribution.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{contribution.memberName}</p>
                        <p className="text-sm text-gray-600">
                          {contribution.contributionType} • {new Date(contribution.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {parseFloat(contribution.amount).toFixed(2)} GHS
                      </p>
                      <p className="text-xs text-gray-500">{contribution.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing...</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Processing Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">{results.success} successful</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{results.failed} failed</span>
                  </div>
                )}
              </div>
              
              {results.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-red-700 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index}>
                        {error.contribution}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isProcessing}
            >
              Close
            </button>
            <button
              onClick={handleBatchProcess}
              disabled={isProcessing || selectedContributions.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Process ${selectedContributions.length} Receipts`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchReceiptGenerator;
