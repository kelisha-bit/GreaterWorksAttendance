// Email service utility for sending donation receipts

/**
 * Send donation receipt via email
 * @param {object} receiptData - Receipt data object
 * @param {string} recipientEmail - Donor's email address
 * @param {object} options - Email options
 * @returns {Promise<object>} Email sending result
 */
export const sendReceiptEmail = async (receiptData, recipientEmail, options = {}) => {
  try {
    // In production, this would integrate with an email service like:
    // - SendGrid, Mailgun, AWS SES, or Firebase Functions
    // For now, we'll simulate the email sending
    
    const emailContent = generateEmailContent(receiptData, options);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log email details for development
    console.log('Email would be sent to:', recipientEmail);
    console.log('Email subject:', emailContent.subject);
    console.log('Email content length:', emailContent.html.length);
    
    return {
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email receipt');
  }
};

/**
 * Generate email content for receipt
 * @param {object} receiptData - Receipt data
 * @param {object} options - Email options
 * @returns {object} Email content with subject and HTML body
 */
const generateEmailContent = (receiptData, options = {}) => {
  const { churchName = 'Greater Works Church', churchEmail = 'info@greaterworkschurch.org' } = options;
  
  const subject = `Donation Receipt #${receiptData.receiptNumber} - ${churchName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #fef7e0 0%, #f8f0d6 100%); border-radius: 8px; margin-bottom: 20px; }
        .logo { width: 60px; height: 60px; background: #D4AF37; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
        .church-name { font-size: 24px; font-weight: bold; color: #B8860B; margin-bottom: 5px; }
        .receipt-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #D4AF37; }
        .donation-details { background: #fef7e0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #D4AF37; }
        .amount { font-size: 24px; font-weight: bold; color: #B8860B; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .signature { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">GW</div>
        <div class="church-name">${churchName}</div>
        <p>Thank you for your generous contribution!</p>
    </div>
    
    <div class="receipt-info">
        <h2>Donation Receipt</h2>
        <p><strong>Receipt Number:</strong> ${receiptData.receiptNumber}</p>
        <p><strong>Date:</strong> ${new Date(receiptData.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
    </div>
    
    <div class="donation-details">
        <h3>Donation Information</h3>
        <p><strong>Donor:</strong> ${receiptData.memberName}</p>
        <p><strong>Member ID:</strong> ${receiptData.memberId}</p>
        <p><strong>Contribution Type:</strong> ${receiptData.contributionType}</p>
        <p><strong>Payment Method:</strong> ${receiptData.paymentMethod}</p>
        <p><strong>Amount:</strong> <span class="amount">${receiptData.amount} GHS</span></p>
        ${receiptData.notes ? `<p><strong>Notes:</strong> ${receiptData.notes}</p>` : ''}
    </div>
    
    <div class="footer">
        <p>This receipt serves as official documentation of your donation to ${churchName}. 
        Please retain it for your records and tax purposes.</p>
        
        <div class="signature">
            <p>Sincerely,<br>
            The ${churchName} Team<br>
            <small>${churchEmail}</small></p>
        </div>
    </div>
</body>
</html>
  `;
  
  return { subject, html };
};

/**
 * Send multiple receipts in bulk
 * @param {Array} receiptsData - Array of receipt data objects
 * @param {Array} recipientEmails - Array of corresponding email addresses
 * @param {object} options - Email options
 * @returns {Promise<object>} Bulk email result
 */
export const sendBulkReceiptEmails = async (receiptsData, recipientEmails, options = {}) => {
  if (receiptsData.length !== recipientEmails.length) {
    throw new Error('Receipts data and emails arrays must have the same length');
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < receiptsData.length; i++) {
    try {
      const result = await sendReceiptEmail(receiptsData[i], recipientEmails[i], options);
      results.push(result);
      
      // Add small delay between emails to avoid rate limiting
      if (i < receiptsData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      errors.push({
        index: i,
        email: recipientEmails[i],
        error: error.message
      });
    }
  }
  
  return {
    success: errors.length === 0,
    sentCount: results.length,
    errorCount: errors.length,
    results,
    errors
  };
};

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get member email from member data
 * @param {object} member - Member object
 * @returns {string|null} Email address or null if not found
 */
export const getMemberEmail = (member) => {
  if (!member) return null;
  
  // Check various possible email field names
  return member.email || 
         member.emailAddress || 
         member.contactEmail || 
         member.personalEmail || 
         null;
};

/**
 * Email template configurations
 */
export const EMAIL_TEMPLATES = {
  RECEIPT: {
    subject: 'Donation Receipt',
    template: 'receipt'
  },
  THANK_YOU: {
    subject: 'Thank You for Your Donation',
    template: 'thank-you'
  },
  TAX_RECEIPT: {
    subject: 'Tax Receipt - Annual Donation Summary',
    template: 'tax-receipt'
  }
};

/**
 * Default email configuration
 */
export const DEFAULT_EMAIL_CONFIG = {
  churchName: 'Greater Works Church',
  churchEmail: 'info@greaterworkschurch.org',
  churchPhone: '+233 123 456 789',
  churchAddress: '123 Faith Avenue, Worship City',
  includeSignature: true,
  includeFooter: true
};
