import React from 'react';
import '../styles/receipt.css';
import { format } from 'date-fns';
import { Church } from 'lucide-react';

const DonationReceipt = ({ contribution, receiptNumber }) => {
  if (!contribution) return null;

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

  return (
    <div className="receipt-container">
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
};

export default DonationReceipt;