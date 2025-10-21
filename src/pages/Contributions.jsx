import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Calendar,
  User,
  TrendingUp,
  Plus,
  Filter,
  Receipt,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import DonationReceipt from '../components/DonationReceipt';
import { generateTypedReceiptNumber } from '../utils/receiptUtils';
import { exportReceiptAsPDF, exportReceiptWithData, exportMultipleReceipts } from '../utils/pdfExport';

const Contributions = () => {
  const { isLeader, currentUser } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [filteredContributions, setFilteredContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedContributionForReceipt, setSelectedContributionForReceipt] = useState(null);
  const [stats, setStats] = useState({
    totalTithes: 0,
    totalOfferings: 0,
    totalSeeds: 0,
    totalOther: 0,
    grandTotal: 0
  });

  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    contributionType: 'Tithe',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  });

  const contributionTypes = ['Tithe', 'Offering', 'Seed', 'Building Fund', 'Mission', 'Other'];
  const paymentMethods = ['Cash', 'Mobile Money', 'Bank Transfer', 'Check', 'Card'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterContributions();
  }, [searchTerm, contributions, filterType, filterMonth]);

  useEffect(() => {
    calculateStats();
  }, [filteredContributions]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchContributions(), fetchMembers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      // Create a simple query without complex sorting or filtering that would require an index
      const contributionsRef = collection(db, 'contributions');
      const snapshot = await getDocs(contributionsRef);
      
      let contributionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date in JavaScript instead of in the query
      contributionsList.sort((a, b) => {
        // Handle different date formats safely
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB - dateA; // Sort descending (newest first)
      });
      
      // Cache the contributions data for offline access
      try {
        localStorage.setItem('cachedContributions', JSON.stringify(contributionsList));
      } catch (cacheError) {
        console.error('Error caching contributions:', cacheError);
      }
      
      setContributions(contributionsList);
      setFilteredContributions(contributionsList);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      
      // Show more specific error message
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        toast.error('Database index required. Please follow the link in the console to create it.');
      } else if (error.code === 'unavailable' || error.message.includes('network')) {
        toast.error('Network connection issue. Trying to load from cache...');
        // Try to load from cache if available
        try {
          const cachedData = localStorage.getItem('cachedContributions');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setContributions(parsedData);
            setFilteredContributions(parsedData);
            toast.success('Loaded data from cache');
          }
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError);
        }
      } else {
        toast.error('Failed to load contributions. Please check permissions.');
      }
    }
  };

  const fetchMembers = async () => {
    try {
      const q = query(collection(db, 'members'), orderBy('fullName'));
      const snapshot = await getDocs(q);
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const filterContributions = () => {
    let filtered = [...contributions];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contrib =>
        contrib.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrib.contributionType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(contrib => contrib.contributionType === filterType);
    }

    // Filter by month
    if (filterMonth) {
      filtered = filtered.filter(contrib => contrib.date.startsWith(filterMonth));
    }

    setFilteredContributions(filtered);
  };

  const calculateStats = () => {
    const stats = {
      totalTithes: 0,
      totalOfferings: 0,
      totalSeeds: 0,
      totalOther: 0,
      grandTotal: 0
    };

    filteredContributions.forEach(contrib => {
      const amount = parseFloat(contrib.amount) || 0;
      stats.grandTotal += amount;

      switch (contrib.contributionType) {
        case 'Tithe':
          stats.totalTithes += amount;
          break;
        case 'Offering':
          stats.totalOfferings += amount;
          break;
        case 'Seed':
          stats.totalSeeds += amount;
          break;
        default:
          stats.totalOther += amount;
      }
    });

    setStats(stats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.memberId || !formData.amount || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const contributionData = {
        memberId: formData.memberId,
        memberName: formData.memberName,
        contributionType: formData.contributionType,
        amount: parseFloat(formData.amount),
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        recordedBy: currentUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Generate receipt number for new contributions
      if (!editMode) {
        contributionData.receiptNumber = generateTypedReceiptNumber(contributionData);
      }

      if (editMode && selectedContribution) {
        await updateDoc(doc(db, 'contributions', selectedContribution.id), contributionData);
        toast.success('Contribution updated successfully');
      } else {
        await addDoc(collection(db, 'contributions'), contributionData);
        toast.success('Contribution recorded successfully');
      }

      fetchContributions();
      closeModal();
    } catch (error) {
      console.error('Error saving contribution:', error);
      toast.error('Failed to save contribution');
    }
  };

  const handleEdit = (contribution) => {
    setSelectedContribution(contribution);
    setFormData({
      memberId: contribution.memberId,
      memberName: contribution.memberName,
      contributionType: contribution.contributionType,
      amount: contribution.amount.toString(),
      date: contribution.date,
      paymentMethod: contribution.paymentMethod,
      notes: contribution.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (contributionId) => {
    if (!window.confirm('Are you sure you want to delete this contribution record?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'contributions', contributionId));
      toast.success('Contribution deleted successfully');
      fetchContributions();
    } catch (error) {
      console.error('Error deleting contribution:', error);
      toast.error('Failed to delete contribution');
    }
  };

  const handleGenerateReceipt = (contribution) => {
    setSelectedContributionForReceipt(contribution);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setSelectedContributionForReceipt(null);
  };

  const handlePrintReceipt = () => {
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
              .church-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
              .church-logo { width: 60px; height: 60px; background: #D4AF37; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
              .church-name { font-size: 28px; font-weight: bold; color: #B8860B; margin-bottom: 5px; }
              .receipt-title { color: #666; font-size: 18px; }
              .receipt-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
              .info-section h3 { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .info-section p { font-size: 16px; margin: 0; }
              .donor-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              .donation-details { background: #fef7e0; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
              .detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
              .amount { font-size: 24px; font-weight: bold; color: #B8860B; }
              .thank-you { text-align: center; padding: 30px 0; }
              .church-footer { border-top: 1px solid #ddd; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; font-size: 14px; color: #666; }
              .footer-section h4 { font-weight: 600; color: #333; margin-bottom: 8px; }
              .footer-section p { margin: 2px 0; }
              .receipt-footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${receiptContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      if (selectedContributionForReceipt) {
        const filename = `donation-receipt-${selectedContributionForReceipt.memberName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Try to export the receipt content as PDF
        await exportReceiptAsPDF('receipt-content', filename);
        toast.success('Receipt downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try printing instead.');
    }
  };

  const handleExportAllReceipts = async () => {
    try {
      if (filteredContributions.length === 0) {
        toast.error('No contributions to export');
        return;
      }

      const filename = `all-donation-receipts-${new Date().toISOString().split('T')[0]}.pdf`;
      await exportMultipleReceipts(filteredContributions, filename);
      toast.success(`Exported ${filteredContributions.length} receipts successfully`);
    } catch (error) {
      console.error('Error exporting receipts:', error);
      toast.error('Failed to export receipts');
    }
  };

  const handleMemberSelect = (e) => {
    const memberId = e.target.value;
    const member = members.find(m => m.memberId === memberId);
    
    setFormData({
      ...formData,
      memberId: memberId,
      memberName: member ? member.fullName : ''
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedContribution(null);
    setFormData({
      memberId: '',
      memberName: '',
      contributionType: 'Tithe',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      notes: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="card text-center py-12">
        <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Only administrators and leaders can access financial records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Financial Contributions</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportAllReceipts}
            className="btn-secondary flex items-center justify-center space-x-2"
            disabled={filteredContributions.length === 0}
          >
            <Download className="w-5 h-5" />
            <span>Export All Receipts</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Record Contribution</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Total Tithes</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalTithes)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Offerings</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalOfferings)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Total Seeds</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalSeeds)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Other</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalOther)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-church-gold to-church-darkGold text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Grand Total</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.grandTotal)}</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by member name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              {contributionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input-field"
              placeholder="Filter by month"
            />
          </div>
        </div>
      </div>

      {/* Contributions List */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            All Contributions ({filteredContributions.length})
          </h2>
        </div>

        {filteredContributions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No contributions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notes</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributions.map((contribution) => (
                  <tr key={contribution.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(contribution.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {contribution.memberName}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-church-lightGold text-church-darkGold rounded-full text-xs">
                        {contribution.contributionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600">
                      {formatCurrency(contribution.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {contribution.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {contribution.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleGenerateReceipt(contribution)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Generate Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(contribution)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contribution.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Contribution Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? 'Edit Contribution' : 'Record New Contribution'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Select Member *</label>
                  <select
                    value={formData.memberId}
                    onChange={handleMemberSelect}
                    className="input-field"
                    required
                  >
                    <option value="">Choose a member...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.memberId}>
                        {member.fullName} ({member.memberId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Contribution Type *</label>
                  <select
                    value={formData.contributionType}
                    onChange={(e) => setFormData({ ...formData, contributionType: e.target.value })}
                    className="input-field"
                    required
                  >
                    {contributionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Amount (GHS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="input-field"
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update Contribution' : 'Record Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedContributionForReceipt && (
        <DonationReceipt
          contribution={selectedContributionForReceipt}
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
          onDownload={handleDownloadReceipt}
        />
      )}
    </div>
  );
};

export default Contributions;
