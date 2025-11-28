// Receipt templates for different contribution types

/**
 * Get receipt template based on contribution type
 * @param {string} contributionType - Type of contribution
 * @param {object} receiptData - Receipt data
 * @returns {object} Template configuration
 */
export const getReceiptTemplate = (contributionType, receiptData) => {
  const templates = {
    'Tithe': {
      title: 'Tithe Receipt',
      subtitle: 'Thank you for your faithful tithe contribution',
      theme: {
        primaryColor: '#10b981',
        secondaryColor: '#059669',
        backgroundColor: '#f0fdf4',
        borderColor: '#10b981'
      },
      message: 'Your tithe helps support the ministry and mission of our church. May God bless your faithfulness.',
      scripture: 'Malachi 3:10 - "Bring the whole tithe into the storehouse... Test me in this," says the LORD Almighty, "and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it."',
      footer: 'This tithe receipt acknowledges your contribution to the work of the ministry.'
    },
    
    'Offering': {
      title: 'Offering Receipt',
      subtitle: 'Thank you for your generous offering',
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#1d4ed8',
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6'
      },
      message: 'Your offering supports the various ministries and outreach programs of our church.',
      scripture: '2 Corinthians 9:7 - "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."',
      footer: 'This offering receipt acknowledges your contribution to the ministry work.'
    },
    
    'Seed': {
      title: 'Seed Faith Offering Receipt',
      subtitle: 'Thank you for your seed faith offering',
      theme: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#7c3aed',
        backgroundColor: '#f5f3ff',
        borderColor: '#8b5cf6'
      },
      message: 'Your seed faith offering demonstrates your trust in God for a harvest. We believe God will multiply your seed.',
      scripture: 'Luke 6:38 - "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap."',
      footer: 'This seed faith offering receipt acknowledges your faith-filled contribution.'
    },
    
    'Building Fund': {
      title: 'Building Fund Receipt',
      subtitle: 'Thank you for supporting our building project',
      theme: {
        primaryColor: '#f59e0b',
        secondaryColor: '#d97706',
        backgroundColor: '#fffbeb',
        borderColor: '#f59e0b'
      },
      message: 'Your contribution to the building fund helps us create a permanent home for our ministry and community.',
      scripture: 'Haggai 1:8 - "Go up into the mountains and bring down timber and build my house, so that I may take pleasure in it and be honored," says the LORD.',
      footer: 'This building fund receipt acknowledges your contribution to our church construction project.'
    },
    
    'Mission': {
      title: 'Mission Offering Receipt',
      subtitle: 'Thank you for supporting global missions',
      theme: {
        primaryColor: '#ef4444',
        secondaryColor: '#dc2626',
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444'
      },
      message: 'Your mission offering supports evangelism, church planting, and humanitarian efforts around the world.',
      scripture: 'Matthew 28:19-20 - "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit."',
      footer: 'This mission offering receipt acknowledges your contribution to global outreach.'
    },
    
    'Other': {
      title: 'Donation Receipt',
      subtitle: 'Thank you for your generous contribution',
      theme: {
        primaryColor: '#6b7280',
        secondaryColor: '#4b5563',
        backgroundColor: '#f9fafb',
        borderColor: '#6b7280'
      },
      message: 'Your contribution helps support the various ministries and operations of our church.',
      scripture: 'Proverbs 11:25 - "A generous person will prosper; whoever refreshes others will be refreshed."',
      footer: 'This donation receipt acknowledges your contribution to our church ministry.'
    }
  };

  return templates[contributionType] || templates['Other'];
};

/**
 * Generate themed receipt HTML based on template
 * @param {object} receiptData - Receipt data
 * @param {object} template - Template configuration
 * @returns {string} HTML string for receipt
 */
export const generateThemedReceiptHTML = (receiptData, template) => {
  const { theme } = template;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${template.title}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: ${theme.backgroundColor};
                color: #333;
            }
            .receipt-container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .receipt-header { 
                text-align: center; 
                padding: 2rem 1.5rem; 
                background: linear-gradient(135deg, ${theme.primaryColor}22 0%, ${theme.primaryColor}11 100%); 
                border-bottom: 3px solid ${theme.primaryColor};
                position: relative;
            }
            .receipt-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor});
            }
            .church-logo { 
                width: 80px; 
                height: 80px; 
                background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}); 
                border-radius: 50%; 
                margin: 0 auto 1rem; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: 24px; 
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .church-name { 
                font-size: 2rem; 
                font-weight: bold; 
                color: ${theme.primaryColor}; 
                margin-bottom: 0.5rem;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
            }
            .receipt-title { 
                color: #666; 
                font-size: 1.125rem; 
                margin-bottom: 1rem;
            }
            .receipt-subtitle {
                color: ${theme.primaryColor};
                font-weight: 500;
                font-style: italic;
                margin-bottom: 1rem;
            }
            .receipt-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                padding: 1.5rem;
                background: #fafafa;
                border-bottom: 1px solid #e5e5e5;
            }
            .info-section h3 {
                font-size: 0.75rem;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
            }
            .info-section p {
                font-size: 1rem;
                margin: 0;
                font-weight: 500;
            }
            .receipt-number {
                font-family: 'Courier New', monospace;
                color: ${theme.primaryColor};
                font-weight: bold;
            }
            .donor-info {
                background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
                padding: 1.5rem;
                border-radius: 8px;
                margin: 1.5rem;
                border-left: 4px solid ${theme.primaryColor};
            }
            .donor-info h3 {
                font-size: 0.875rem;
                font-weight: 600;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 1rem;
            }
            .donation-details {
                background: linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.primaryColor}11 100%);
                padding: 1.5rem;
                border-radius: 8px;
                margin: 1.5rem;
                border: 2px solid ${theme.primaryColor};
                position: relative;
            }
            .donation-details::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor});
                border-radius: 8px;
                z-index: -1;
            }
            .donation-details h3 {
                font-size: 0.875rem;
                font-weight: 600;
                color: ${theme.primaryColor};
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 1rem;
            }
            .receipt-table {
                width: 100%;
                border-collapse: collapse;
            }
            .receipt-table th, .receipt-table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }
            .receipt-table th {
                background: rgba(0, 0, 0, 0.05);
                font-weight: 600;
            }
            .donation-amount {
                font-size: 1.5rem;
                font-weight: bold;
                color: ${theme.primaryColor};
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
            }
            .message-section {
                background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
                padding: 2rem 1.5rem;
                border-top: 2px solid ${theme.primaryColor};
                border-bottom: 2px solid ${theme.primaryColor};
                text-align: center;
            }
            .message-section h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: ${theme.primaryColor};
                margin-bottom: 1rem;
            }
            .message-section p {
                color: #666;
                line-height: 1.6;
                margin-bottom: 1rem;
            }
            .scripture {
                font-style: italic;
                color: ${theme.primaryColor};
                font-size: 0.9rem;
                margin-top: 1rem;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 8px;
            }
            .receipt-footer {
                text-align: center;
                padding: 1.5rem;
                background: #f5f5f5;
                border-top: 1px solid #ddd;
                font-size: 0.875rem;
                color: #666;
            }
            .receipt-footer p {
                margin: 0.25rem 0;
            }
            .signature-section {
                margin-top: 2rem;
                text-align: center;
            }
            .signature-line {
                border-bottom: 1px solid #333;
                height: 1px;
                width: 200px;
                margin: 0 auto 10px;
            }
            @media print { 
                body { margin: 0; }
                .receipt-container { 
                    box-shadow: none; 
                    border-radius: 0; 
                    margin: 0;
                }
            }
            @media (max-width: 768px) {
                .receipt-info {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                .church-name {
                    font-size: 1.5rem;
                }
                .donation-amount {
                    font-size: 1.25rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="receipt-header">
                <div class="church-logo">GW</div>
                <div class="church-name">Greater Works Church</div>
                <div class="receipt-title">${template.title}</div>
                <div class="receipt-subtitle">${template.subtitle}</div>
                <div class="receipt-info">
                    <div class="info-section">
                        <h3>Receipt Number</h3>
                        <p class="receipt-number">${receiptData.receiptNumber}</p>
                    </div>
                    <div class="info-section">
                        <h3>Date</h3>
                        <p>${new Date(receiptData.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                    </div>
                </div>
            </div>
            
            <div class="donor-info">
                <h3>Donor Information</h3>
                <p><strong>Name:</strong> ${receiptData.memberName}</p>
                <p><strong>Member ID:</strong> ${receiptData.memberId}</p>
            </div>
            
            <div class="donation-details">
                <h3>Donation Details</h3>
                <table class="receipt-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${receiptData.contributionType}</td>
                            <td class="donation-amount">${parseFloat(receiptData.amount).toFixed(2)} GHS</td>
                        </tr>
                        ${receiptData.notes ? `
                            <tr>
                                <td colspan="2" style="padding: 8px; font-size: 12px; color: #666;">
                                    <strong>Notes:</strong> ${receiptData.notes}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="font-weight: bold;">Total</td>
                            <td style="font-weight: bold; font-size: 1.5rem; color: ${theme.primaryColor};">
                                ${parseFloat(receiptData.amount).toFixed(2)} GHS
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="message-section">
                <h3>Thank You Message</h3>
                <p>${template.message}</p>
                <div class="scripture">
                    <strong>Scripture:</strong> ${template.scripture}
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>${template.footer}</p>
                <p>This receipt is an important document. Please retain it for tax purposes.</p>
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <p>Authorized Signature</p>
                </div>
                <p style="margin-top: 2rem; font-size: 0.75rem; color: #999;">
                    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Get all available receipt templates
 * @returns {object} All template configurations
 */
export const getAllReceiptTemplates = () => {
  return {
    'Tithe': {
      name: 'Tithe Receipt',
      description: 'Template for tithe contributions with green theme',
      icon: '🌱',
      color: '#10b981'
    },
    'Offering': {
      name: 'Offering Receipt',
      description: 'Template for general offerings with blue theme',
      icon: '💙',
      color: '#3b82f6'
    },
    'Seed': {
      name: 'Seed Faith Offering',
      description: 'Template for seed faith offerings with purple theme',
      icon: '🌾',
      color: '#8b5cf6'
    },
    'BuildingFund': {
      name: 'Building Fund',
      description: 'Template for building fund contributions with amber theme',
      icon: '🏗️',
      color: '#f59e0b'
    },
    'Mission': {
      name: 'Mission Offering',
      description: 'Template for mission offerings with red theme',
      icon: '🌍',
      color: '#ef4444'
    },
    'Other': {
      name: 'General Donation',
      description: 'Template for other contributions with gray theme',
      icon: '🎁',
      color: '#6b7280'
    }
  };
};

/**
 * Create custom receipt template
 * @param {object} templateConfig - Custom template configuration
 * @returns {object} Custom template
 */
export const createCustomTemplate = (templateConfig) => {
  const defaultConfig = {
    title: 'Donation Receipt',
    subtitle: 'Thank you for your contribution',
    theme: {
      primaryColor: '#6b7280',
      secondaryColor: '#4b5563',
      backgroundColor: '#f9fafb',
      borderColor: '#6b7280'
    },
    message: 'Thank you for your generous contribution to our ministry.',
    scripture: '2 Corinthians 9:7 - "Each of you should give what you have decided in your heart to give..."',
    footer: 'This receipt acknowledges your contribution to our church ministry.'
  };

  return { ...defaultConfig, ...templateConfig };
};
