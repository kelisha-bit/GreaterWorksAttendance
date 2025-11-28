// Receipt tracking system for monitoring and managing generated receipts

import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Track receipt generation in the database
 * @param {object} receiptData - Receipt data to track
 * @returns {Promise<object>} Tracking result
 */
export const trackReceiptGeneration = async (receiptData) => {
  try {
    const trackingData = {
      receiptNumber: receiptData.receiptNumber,
      contributionId: receiptData.contributionId,
      memberId: receiptData.memberId,
      memberName: receiptData.memberName,
      amount: receiptData.amount,
      contributionType: receiptData.contributionType,
      paymentMethod: receiptData.paymentMethod,
      date: receiptData.date,
      generatedAt: new Date().toISOString(),
      generatedBy: receiptData.generatedBy || 'system',
      status: 'generated',
      deliveryMethod: 'none', // 'email', 'print', 'download', 'share'
      emailSent: false,
      emailSentAt: null,
      printed: false,
      printedAt: null,
      downloaded: false,
      downloadedAt: null,
      shared: false,
      sharedAt: null,
      notes: receiptData.notes || ''
    };

    const docRef = await addDoc(collection(db, 'receiptTracking'), trackingData);
    
    return {
      success: true,
      trackingId: docRef.id,
      ...trackingData
    };
  } catch (error) {
    console.error('Error tracking receipt generation:', error);
    throw new Error('Failed to track receipt generation');
  }
};

/**
 * Update receipt tracking status
 * @param {string} trackingId - Tracking document ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Update result
 */
export const updateReceiptTracking = async (trackingId, updates) => {
  try {
    const trackingRef = doc(db, 'receiptTracking', trackingId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(trackingRef, updateData);

    return {
      success: true,
      trackingId,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating receipt tracking:', error);
    throw new Error('Failed to update receipt tracking');
  }
};

/**
 * Mark receipt as emailed
 * @param {string} trackingId - Tracking document ID
 * @param {string} recipientEmail - Email address of recipient
 * @returns {Promise<object>} Update result
 */
export const markReceiptEmailed = async (trackingId, recipientEmail) => {
  return updateReceiptTracking(trackingId, {
    deliveryMethod: 'email',
    emailSent: true,
    emailSentAt: new Date().toISOString(),
    emailRecipient: recipientEmail
  });
};

/**
 * Mark receipt as printed
 * @param {string} trackingId - Tracking document ID
 * @returns {Promise<object>} Update result
 */
export const markReceiptPrinted = async (trackingId) => {
  return updateReceiptTracking(trackingId, {
    deliveryMethod: 'print',
    printed: true,
    printedAt: new Date().toISOString()
  });
};

/**
 * Mark receipt as downloaded
 * @param {string} trackingId - Tracking document ID
 * @returns {Promise<object>} Update result
 */
export const markReceiptDownloaded = async (trackingId) => {
  return updateReceiptTracking(trackingId, {
    deliveryMethod: 'download',
    downloaded: true,
    downloadedAt: new Date().toISOString()
  });
};

/**
 * Mark receipt as shared
 * @param {string} trackingId - Tracking document ID
 * @param {string} shareMethod - Method used for sharing
 * @returns {Promise<object>} Update result
 */
export const markReceiptShared = async (trackingId, shareMethod = 'native') => {
  return updateReceiptTracking(trackingId, {
    deliveryMethod: 'share',
    shared: true,
    sharedAt: new Date().toISOString(),
    shareMethod
  });
};

/**
 * Get receipt tracking history
 * @param {object} filters - Filters to apply
 * @returns {Promise<Array>} Array of tracking records
 */
export const getReceiptTrackingHistory = async (filters = {}) => {
  try {
    let q = collection(db, 'receiptTracking');
    
    // Apply filters
    if (filters.memberId) {
      q = query(q, where('memberId', '==', filters.memberId));
    }
    
    if (filters.contributionId) {
      q = query(q, where('contributionId', '==', filters.contributionId));
    }
    
    if (filters.contributionType) {
      q = query(q, where('contributionType', '==', filters.contributionType));
    }
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.deliveryMethod) {
      q = query(q, where('deliveryMethod', '==', filters.deliveryMethod));
    }
    
    // Order by generation date (newest first)
    q = query(q, orderBy('generatedAt', 'desc'));
    
    // Apply date range filter if specified
    if (filters.startDate && filters.endDate) {
      q = query(q, where('generatedAt', '>=', filters.startDate));
      q = query(q, where('generatedAt', '<=', filters.endDate));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching receipt tracking history:', error);
    throw new Error('Failed to fetch receipt tracking history');
  }
};

/**
 * Get receipt statistics
 * @param {object} filters - Filters to apply
 * @returns {Promise<object>} Receipt statistics
 */
export const getReceiptStatistics = async (filters = {}) => {
  try {
    const trackingHistory = await getReceiptTrackingHistory(filters);
    
    const stats = {
      totalGenerated: trackingHistory.length,
      emailSent: trackingHistory.filter(r => r.emailSent).length,
      printed: trackingHistory.filter(r => r.printed).length,
      downloaded: trackingHistory.filter(r => r.downloaded).length,
      shared: trackingHistory.filter(r => r.shared).length,
      byContributionType: {},
      byDeliveryMethod: {},
      byMonth: {},
      totalAmount: 0,
      averageAmount: 0
    };

    trackingHistory.forEach(receipt => {
      // By contribution type
      if (!stats.byContributionType[receipt.contributionType]) {
        stats.byContributionType[receipt.contributionType] = 0;
      }
      stats.byContributionType[receipt.contributionType]++;

      // By delivery method
      if (!stats.byDeliveryMethod[receipt.deliveryMethod]) {
        stats.byDeliveryMethod[receipt.deliveryMethod] = 0;
      }
      stats.byDeliveryMethod[receipt.deliveryMethod]++;

      // By month
      const month = receipt.generatedAt.substring(0, 7); // YYYY-MM format
      if (!stats.byMonth[month]) {
        stats.byMonth[month] = 0;
      }
      stats.byMonth[month]++;

      // Amount calculations
      stats.totalAmount += parseFloat(receipt.amount) || 0;
    });

    stats.averageAmount = stats.totalGenerated > 0 ? stats.totalAmount / stats.totalGenerated : 0;

    return stats;
  } catch (error) {
    console.error('Error calculating receipt statistics:', error);
    throw new Error('Failed to calculate receipt statistics');
  }
};

/**
 * Search receipts by various criteria
 * @param {string} searchTerm - Search term
 * @param {object} filters - Additional filters
 * @returns {Promise<Array>} Matching receipts
 */
export const searchReceipts = async (searchTerm, filters = {}) => {
  try {
    const trackingHistory = await getReceiptTrackingHistory(filters);
    
    if (!searchTerm) {
      return trackingHistory;
    }

    const searchLower = searchTerm.toLowerCase();
    
    return trackingHistory.filter(receipt => 
      receipt.receiptNumber.toLowerCase().includes(searchLower) ||
      receipt.memberName.toLowerCase().includes(searchLower) ||
      receipt.memberId.toLowerCase().includes(searchLower) ||
      receipt.contributionType.toLowerCase().includes(searchLower) ||
      (receipt.notes && receipt.notes.toLowerCase().includes(searchLower))
    );
  } catch (error) {
    console.error('Error searching receipts:', error);
    throw new Error('Failed to search receipts');
  }
};

/**
 * Delete receipt tracking record
 * @param {string} trackingId - Tracking document ID
 * @returns {Promise<object>} Delete result
 */
export const deleteReceiptTracking = async (trackingId) => {
  try {
    await deleteDoc(doc(db, 'receiptTracking', trackingId));
    return {
      success: true,
      trackingId,
      deletedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error deleting receipt tracking:', error);
    throw new Error('Failed to delete receipt tracking');
  }
};

/**
 * Get member receipt history
 * @param {string} memberId - Member ID
 * @returns {Promise<Array>} Member's receipt history
 */
export const getMemberReceiptHistory = async (memberId) => {
  return getReceiptTrackingHistory({ memberId });
};

/**
 * Get receipts by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Receipts in date range
 */
export const getReceiptsByDateRange = async (startDate, endDate) => {
  return getReceiptTrackingHistory({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
};

/**
 * Export receipt tracking data
 * @param {object} filters - Filters to apply
 * @param {string} format - Export format ('json', 'csv')
 * @returns {Promise<string>} Exported data
 */
export const exportReceiptTracking = async (filters = {}, format = 'json') => {
  try {
    const trackingHistory = await getReceiptTrackingHistory(filters);
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'Receipt Number', 'Member Name', 'Member ID', 'Amount', 'Type', 
        'Payment Method', 'Date', 'Generated At', 'Delivery Method', 
        'Email Sent', 'Printed', 'Downloaded', 'Shared'
      ];
      
      const csvRows = [
        headers.join(','),
        ...trackingHistory.map(receipt => [
          receipt.receiptNumber,
          receipt.memberName,
          receipt.memberId,
          receipt.amount,
          receipt.contributionType,
          receipt.paymentMethod,
          receipt.date,
          receipt.generatedAt,
          receipt.deliveryMethod,
          receipt.emailSent,
          receipt.printed,
          receipt.downloaded,
          receipt.shared
        ].map(field => `"${field}"`).join(','))
      ];
      
      return csvRows.join('\n');
    } else {
      // Return JSON format
      return JSON.stringify(trackingHistory, null, 2);
    }
  } catch (error) {
    console.error('Error exporting receipt tracking:', error);
    throw new Error('Failed to export receipt tracking');
  }
};

/**
 * Receipt tracking constants
 */
export const RECEIPT_STATUS = {
  GENERATED: 'generated',
  EMAILED: 'emailed',
  PRINTED: 'printed',
  DOWNLOADED: 'downloaded',
  SHARED: 'shared'
};

export const DELIVERY_METHODS = {
  EMAIL: 'email',
  PRINT: 'print',
  DOWNLOAD: 'download',
  SHARE: 'share',
  NONE: 'none'
};
