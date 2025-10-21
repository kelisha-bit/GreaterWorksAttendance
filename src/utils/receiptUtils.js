// Receipt utility functions for generating and tracking receipt numbers

/**
 * Generate a unique receipt number
 * Format: RCP-YYYYMMDD-XXXXXX
 * @returns {string} Unique receipt number
 */
export const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = String(now.getTime()).slice(-6);
  
  return `RCP-${year}${month}${day}-${timestamp}`;
};

/**
 * Generate a receipt number with custom prefix
 * @param {string} prefix - Custom prefix for receipt number
 * @returns {string} Unique receipt number with custom prefix
 */
export const generateCustomReceiptNumber = (prefix = 'RCP') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = String(now.getTime()).slice(-6);
  
  return `${prefix}-${year}${month}${day}-${timestamp}`;
};

/**
 * Parse receipt number to extract date information
 * @param {string} receiptNumber - Receipt number to parse
 * @returns {object} Parsed receipt information
 */
export const parseReceiptNumber = (receiptNumber) => {
  const parts = receiptNumber.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid receipt number format');
  }
  
  const [prefix, dateStr, timestamp] = parts;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return {
    prefix,
    date: new Date(year, month - 1, day),
    timestamp,
    formattedDate: `${day}/${month}/${year}`
  };
};

/**
 * Validate receipt number format
 * @param {string} receiptNumber - Receipt number to validate
 * @returns {boolean} True if valid format
 */
export const validateReceiptNumber = (receiptNumber) => {
  const pattern = /^[A-Z]{2,4}-\d{8}-\d{6}$/;
  return pattern.test(receiptNumber);
};

/**
 * Generate receipt number for a specific contribution
 * @param {object} contribution - Contribution data
 * @returns {string} Receipt number for the contribution
 */
export const generateContributionReceiptNumber = (contribution) => {
  // Use contribution ID if available, otherwise generate new
  if (contribution.id) {
    const date = new Date(contribution.date || contribution.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const idSuffix = contribution.id.slice(-4).toUpperCase();
    
    return `RCP-${year}${month}${day}-${idSuffix}`;
  }
  
  return generateReceiptNumber();
};

/**
 * Format receipt number for display
 * @param {string} receiptNumber - Receipt number to format
 * @returns {string} Formatted receipt number
 */
export const formatReceiptNumber = (receiptNumber) => {
  if (!receiptNumber) return '';
  
  // Add spaces for better readability
  return receiptNumber.replace(/(\w+)-(\d{8})-(\d{6})/, '$1-$2-$3');
};

/**
 * Get receipt number from contribution data
 * @param {object} contribution - Contribution data
 * @returns {string} Receipt number
 */
export const getReceiptNumber = (contribution) => {
  // Check if receipt number already exists
  if (contribution.receiptNumber) {
    return contribution.receiptNumber;
  }
  
  // Generate new receipt number
  return generateContributionReceiptNumber(contribution);
};

/**
 * Create receipt data object
 * @param {object} contribution - Contribution data
 * @param {string} receiptNumber - Receipt number (optional)
 * @returns {object} Receipt data object
 */
export const createReceiptData = (contribution, receiptNumber = null) => {
  const receiptNum = receiptNumber || getReceiptNumber(contribution);
  
  return {
    receiptNumber: receiptNum,
    contributionId: contribution.id,
    memberId: contribution.memberId,
    memberName: contribution.memberName,
    amount: contribution.amount,
    contributionType: contribution.contributionType,
    paymentMethod: contribution.paymentMethod,
    date: contribution.date,
    notes: contribution.notes,
    generatedAt: new Date().toISOString(),
    generatedBy: contribution.recordedBy || 'system'
  };
};

/**
 * Receipt number constants
 */
export const RECEIPT_PREFIXES = {
  TITHE: 'TIT',
  OFFERING: 'OFF',
  SEED: 'SEED',
  BUILDING: 'BLD',
  MISSION: 'MIS',
  OTHER: 'OTH',
  DEFAULT: 'RCP'
};

/**
 * Generate receipt number based on contribution type
 * @param {object} contribution - Contribution data
 * @returns {string} Receipt number with type-specific prefix
 */
export const generateTypedReceiptNumber = (contribution) => {
  const prefix = RECEIPT_PREFIXES[contribution.contributionType?.toUpperCase()] || RECEIPT_PREFIXES.DEFAULT;
  return generateCustomReceiptNumber(prefix);
};
