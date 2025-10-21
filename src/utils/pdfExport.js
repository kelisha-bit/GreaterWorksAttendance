import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export receipt as PDF
 * @param {string} elementId - ID of the element to export
 * @param {string} filename - Name of the PDF file
 * @param {object} options - Export options
 */
export const exportReceiptAsPDF = async (elementId, filename = 'donation-receipt.pdf', options = {}) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Configure html2canvas options
    const canvasOptions = {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ...options.canvas
    };

    // Generate canvas from HTML element
    const canvas = await html2canvas(element, canvasOptions);
    const imgData = canvas.toDataURL('image/png');

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      ...options.pdf
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

/**
 * Export receipt with custom styling
 * @param {object} receiptData - Receipt data object
 * @param {string} filename - Name of the PDF file
 */
export const exportReceiptWithData = async (receiptData, filename = 'donation-receipt.pdf') => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font
    pdf.setFont('helvetica');

    // Add header
    pdf.setFontSize(20);
    pdf.setTextColor(184, 134, 11); // Gold color
    pdf.text('Greater Works Church', 105, 20, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Donation Receipt', 105, 28, { align: 'center' });

    // Add receipt number
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Receipt Number: ${receiptData.receiptNumber}`, 20, 40);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

    // Add donor information
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Donor Information:', 20, 55);
    pdf.setFontSize(10);
    pdf.text(`Name: ${receiptData.memberName}`, 20, 62);
    pdf.text(`Member ID: ${receiptData.memberId}`, 20, 67);

    // Add donation details
    pdf.setFontSize(12);
    pdf.text('Donation Details:', 20, 80);
    pdf.setFontSize(10);
    pdf.text(`Type: ${receiptData.contributionType}`, 20, 87);
    pdf.text(`Amount: ${receiptData.amount} GHS`, 20, 92);
    pdf.text(`Payment Method: ${receiptData.paymentMethod}`, 20, 97);
    pdf.text(`Date: ${receiptData.date}`, 20, 102);

    if (receiptData.notes) {
      pdf.text(`Notes: ${receiptData.notes}`, 20, 107);
    }

    // Add thank you message
    pdf.setFontSize(12);
    pdf.setTextColor(184, 134, 11);
    pdf.text('Thank You for Your Generous Contribution!', 105, 130, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Your donation helps us continue our mission and serve our community.', 105, 140, { align: 'center' });

    // Add church information
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Greater Works Church', 20, 200);
    pdf.text('123 Church Street, Accra, Ghana', 20, 205);
    pdf.text('Phone: +233 123 456 789', 20, 210);
    pdf.text('Email: info@greaterworkschurch.org', 20, 215);

    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
    pdf.text('This is an official receipt from Greater Works Church', 105, 285, { align: 'center' });

    // Save the PDF
    pdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
};

/**
 * Export multiple receipts as a single PDF
 * @param {Array} receiptsData - Array of receipt data objects
 * @param {string} filename - Name of the PDF file
 */
export const exportMultipleReceipts = async (receiptsData, filename = 'donation-receipts.pdf') => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let isFirstPage = true;

    for (const receiptData of receiptsData) {
      if (!isFirstPage) {
        pdf.addPage();
      }

      // Add header for each receipt
      pdf.setFontSize(16);
      pdf.setTextColor(184, 134, 11);
      pdf.text('Greater Works Church', 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Donation Receipt', 105, 28, { align: 'center' });

      // Add receipt details
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Receipt Number: ${receiptData.receiptNumber}`, 20, 40);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
      pdf.text(`Donor: ${receiptData.memberName}`, 20, 50);
      pdf.text(`Amount: ${receiptData.amount} GHS`, 20, 55);
      pdf.text(`Type: ${receiptData.contributionType}`, 20, 60);

      isFirstPage = false;
    }

    pdf.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('Error creating multiple receipts PDF:', error);
    throw error;
  }
};

/**
 * Get PDF export options
 * @returns {object} Default PDF export options
 */
export const getDefaultPDFOptions = () => ({
  canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  },
  pdf: {
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  }
});

/**
 * Validate receipt data for PDF export
 * @param {object} receiptData - Receipt data to validate
 * @returns {boolean} True if valid
 */
export const validateReceiptData = (receiptData) => {
  const requiredFields = ['memberName', 'amount', 'contributionType', 'receiptNumber'];
  return requiredFields.every(field => receiptData[field] !== undefined && receiptData[field] !== null);
};
