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
  TrendingDown,
  Plus,
  Filter,
  Receipt,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Users,
  CreditCard,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { PieChart as RePieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import DonationReceipt from '../components/DonationReceipt';
import BatchReceiptGenerator from '../components/BatchReceiptGenerator';
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
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedContributionForReceipt, setSelectedContributionForReceipt] = useState(null);
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);
  
  // Enhanced statistics
  const [stats, setStats] = useState({
    totalTithes: 0,
    totalOfferings: 0,
    totalSeeds: 0,
    totalOther: 0,
    grandTotal: 0,
    averageContribution: 0,
    topContributor: null,
    contributionGrowth: 0,
    totalContributors: 0,
    monthlyTarget: 10000,
    monthlyProgress: 0
  });

  // Chart data
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState([]);

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
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterContributions();
  }, [searchTerm, contributions, filterType, filterMonth, selectedPeriod, filterYear]);

  useEffect(() => {
    calculateStats();
    prepareChartData();
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

    if (searchTerm) {
      filtered = filtered.filter(contrib =>
        contrib.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrib.contributionType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(contrib => contrib.contributionType === filterType);
    }

    // Apply period-based filtering
    if (selectedPeriod === 'month' && filterMonth) {
      filtered = filtered.filter(contrib => contrib.date.startsWith(filterMonth));
    } else if (selectedPeriod === 'year') {
      filtered = filtered.filter(contrib => contrib.date.startsWith(filterYear));
    }

    setFilteredContributions(filtered);
  };

  const calculateStats = () => {
    const stats = {
      totalTithes: 0,
      totalOfferings: 0,
      totalSeeds: 0,
      totalOther: 0,
      grandTotal: 0,
      averageContribution: 0,
      topContributor: null,
      contributionGrowth: 0,
      totalContributors: 0,
      monthlyTarget: 10000,
      monthlyProgress: 0
    };

    const contributorTotals = {};
    const paymentTotals = {};

    filteredContributions.forEach(contrib => {
      const amount = parseFloat(contrib.amount) || 0;
      stats.grandTotal += amount;

      // Track contributors
      if (!contributorTotals[contrib.memberId]) {
        contributorTotals[contrib.memberId] = {
          name: contrib.memberName,
          total: 0,
          count: 0
        };
      }
      contributorTotals[contrib.memberId].total += amount;
      contributorTotals[contrib.memberId].count += 1;

      // Track payment methods
      if (!paymentTotals[contrib.paymentMethod]) {
        paymentTotals[contrib.paymentMethod] = 0;
      }
      paymentTotals[contrib.paymentMethod] += amount;

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

    // Calculate derived stats
    stats.totalContributors = Object.keys(contributorTotals).length;
    stats.averageContribution = filteredContributions.length > 0 ? stats.grandTotal / filteredContributions.length : 0;
    
    // Find top contributor
    const topContributor = Object.values(contributorTotals).sort((a, b) => b.total - a.total)[0];
    stats.topContributor = topContributor || null;

    // Calculate monthly progress
    stats.monthlyProgress = stats.monthlyTarget > 0 ? (stats.grandTotal / stats.monthlyTarget * 100) : 0;

    // Calculate growth (compare with previous period)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
    
    const currentMonthTotal = contributions
      .filter(c => c.date.startsWith(currentMonth))
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    
    const previousMonthTotal = contributions
      .filter(c => c.date.startsWith(previousMonth))
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    
    stats.contributionGrowth = previousMonthTotal > 0 ? 
      ((currentMonthTotal - previousMonthTotal) / previousMonthTotal * 100) : 0;

    setStats(stats);
    setTopContributors(Object.values(contributorTotals).sort((a, b) => b.total - a.total).slice(0, 10));
    setPaymentMethodBreakdown(Object.entries(paymentTotals).map(([method, amount]) => ({
      method,
      amount,
      percentage: stats.grandTotal > 0 ? (amount / stats.grandTotal * 100) : 0
    })));
  };

  const prepareChartData = () => {
    // Monthly trends (last 12 months)
    const monthlyData = {};
    const last12Months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last12Months.push(key);
      monthlyData[key] = { tithes: 0, offerings: 0, seeds: 0, other: 0, total: 0 };
    }

    contributions.forEach(c => {
      const monthKey = c.date.substring(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        const amount = parseFloat(c.amount || 0);
        switch (c.contributionType) {
          case 'Tithe':
            monthlyData[monthKey].tithes += amount;
            break;
          case 'Offering':
            monthlyData[monthKey].offerings += amount;
            break;
          case 'Seed':
            monthlyData[monthKey].seeds += amount;
            break;
          default:
            monthlyData[monthKey].other += amount;
        }
        monthlyData[monthKey].total += amount;
      }
    });

    const trendsArray = last12Months.map(key => ({
      month: key,
      label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...monthlyData[key]
    }));

    setMonthlyTrends(trendsArray);

    // Type breakdown for current period
    const typeData = {
      'Tithe': stats.totalTithes,
      'Offering': stats.totalOfferings,
      'Seed': stats.totalSeeds,
      'Other': stats.totalOther
    };

    const typeArray = Object.entries(typeData).map(([type, amount]) => ({
      type,
      amount,
      percentage: stats.grandTotal > 0 ? (amount / stats.grandTotal * 100) : 0
    })).filter(item => item.amount > 0);

    setTypeBreakdown(typeArray);
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

  const handleBatchReceiptGenerator = () => {
    setShowBatchGenerator(true);
  };

  const handleCloseBatchGenerator = () => {
    setShowBatchGenerator(false);
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

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? 
      <ArrowUpRight className="w-4 h-4 text-green-600" /> : 
      <ArrowDownRight className="w-4 h-4 text-red-600" />;
  };

  const getGrowthColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
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
      <div className="flex items-center justify-center h-64">
        <Card className="text-center py-12">
          <CardContent>
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators and leaders can access financial records.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contributions Management</h1>
          <p className="text-gray-600 mt-1">Track and manage church contributions with advanced analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBatchReceiptGenerator}
            className="btn-secondary flex items-center space-x-2"
            disabled={filteredContributions.length === 0}
          >
            <FileText className="w-5 h-5" />
            <span>Batch Receipts</span>
          </button>
          <button
            onClick={handleExportAllReceipts}
            className="btn-secondary flex items-center space-x-2"
            disabled={filteredContributions.length === 0}
          >
            <Download className="w-5 h-5" />
            <span>Export All</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Record Contribution</span>
          </button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Tithes</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(stats.totalTithes)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getGrowthIcon(stats.contributionGrowth)}
                  <span className={`text-sm ${getGrowthColor(stats.contributionGrowth)}`}>
                    {formatPercent(stats.contributionGrowth)} growth
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Offerings</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(stats.totalOfferings)}</p>
                <p className="text-sm text-blue-700 mt-2">{stats.totalContributors} contributors</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Average Contribution</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(stats.averageContribution)}</p>
                <p className="text-sm text-purple-700 mt-2">Per contribution</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-church-gold to-church-darkGold text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold opacity-90">Grand Total</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.grandTotal)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  <Target className="w-4 h-4 opacity-70" />
                  <span className="text-sm opacity-80">
                    {formatPercent(stats.monthlyProgress)} of target
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-full">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-church-gold" />
              <span>Monthly Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="tithes" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="offerings" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="seeds" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="other" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-church-gold" />
              <span>Contribution Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={typeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {typeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field"
              >
                <option value="month">Monthly View</option>
                <option value="year">Yearly View</option>
              </select>
            </div>

            {selectedPeriod === 'month' && (
              <div>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="input-field"
                  placeholder="Filter by month"
                />
              </div>
            )}

            {selectedPeriod === 'year' && (
              <div>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="input-field"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            )}

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
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-church-gold" />
              <span>Top Contributors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topContributors.slice(0, 5).map((contributor, index) => (
                <div key={contributor.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-church-lightGold text-church-darkGold'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{contributor.name}</p>
                      <p className="text-xs text-gray-600">{contributor.count} contributions</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(contributor.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Contributions ({filteredContributions.length})</span>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>{paymentMethodBreakdown.length} payment methods</span>
            </div>
          </CardTitle>
        </CardHeader>

        {filteredContributions.length === 0 ? (
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No contributions found</p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
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
          </CardContent>
        )}
      </Card>

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
          receiptNumber={selectedContributionForReceipt.receiptNumber}
          onClose={handleCloseReceipt}
          showModal={true}
        />
      )}

      {/* Batch Receipt Generator Modal */}
      {showBatchGenerator && (
        <BatchReceiptGenerator
          contributions={filteredContributions}
          members={members}
          onClose={handleCloseBatchGenerator}
        />
      )}
    </div>
  );
};

export default Contributions;
