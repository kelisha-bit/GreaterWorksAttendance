import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealtimeMemberData, useRealtimeContributions } from '../hooks/useRealtimeMemberData';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Target,
  Award,
  CreditCard,
  Wallet,
  Activity,
  Filter,
  Receipt,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
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
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MemberContributions = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const { member, loading: memberLoading, error: memberError } = useRealtimeMemberData(memberId);
  const { contributions, loading: contributionsLoading } = useRealtimeContributions(memberId, {
    memberCode: member?.memberId,
    memberName: member?.fullName
  });
  const [contributionStats, setContributionStats] = useState({
    totalAmount: 0,
    totalContributions: 0,
    averageAmount: 0,
    highestAmount: 0,
    lowestAmount: 0,
    thisMonth: 0,
    thisYear: 0,
    monthlyAverage: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const loading = memberLoading || contributionsLoading;

  useEffect(() => {
    if (memberError) {
      toast.error(memberError);
      if (memberError === 'Member not found') {
        navigate('/members');
      }
    }
  }, [memberError, navigate]);

  useEffect(() => {
    if (contributions.length > 0) {
      calculateStats();
      prepareChartData();
    }
  }, [contributions, filterPeriod, filterCategory]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

  const getFilteredContributions = () => {
    let filteredContributions = contributions;
    
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate;
      
      if (filterPeriod === '3months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      } else if (filterPeriod === '6months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      } else if (filterPeriod === '1year') {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      }
      
      if (startDate) {
        filteredContributions = filteredContributions.filter(contribution => new Date(contribution.date) >= startDate);
      }
    }

    if (filterCategory !== 'all') {
      filteredContributions = filteredContributions.filter(contribution => contribution.type === filterCategory);
    }

    return filteredContributions;
  };

  const calculateStats = () => {
    const contributionsList = getFilteredContributions();
    const amounts = contributionsList.map(c => Number(c.amount || 0));
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const totalContributions = contributionsList.length;
    const averageAmount = totalContributions > 0 ? totalAmount / totalContributions : 0;
    const highestAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const lowestAmount = amounts.length > 0 ? Math.min(...amounts) : 0;

    // Calculate this month and this year
    const now = new Date();
    const thisMonth = contributionsList
      .filter(c => {
        const contributionDate = new Date(c.date);
        return contributionDate.getMonth() === now.getMonth() && 
               contributionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const thisYear = contributionsList
      .filter(c => {
        const contributionDate = new Date(c.date);
        return contributionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // Calculate monthly average
    const monthlyTotals = {};
    contributionsList.forEach(contribution => {
      const monthKey = format(new Date(contribution.date), 'MMM yyyy');
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(contribution.amount || 0);
    });

    const monthlyAverage = Object.keys(monthlyTotals).length > 0 
      ? Object.values(monthlyTotals).reduce((sum, total) => sum + total, 0) / Object.keys(monthlyTotals).length
      : 0;

    setContributionStats({
      totalAmount,
      totalContributions,
      averageAmount,
      highestAmount,
      lowestAmount,
      thisMonth,
      thisYear,
      monthlyAverage
    });
  };

  const prepareChartData = () => {
    const contributionsList = getFilteredContributions();
    // Monthly contribution data
    const monthlyContributions = {};
    contributionsList.forEach(contribution => {
      const monthKey = format(new Date(contribution.date), 'MMM yyyy');
      if (!monthlyContributions[monthKey]) {
        monthlyContributions[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      monthlyContributions[monthKey].amount += Number(contribution.amount || 0);
      monthlyContributions[monthKey].count += 1;
    });

    const monthlyArray = Object.values(monthlyContributions)
      .slice(-12)
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    setMonthlyData(monthlyArray);

    // Category distribution
    const categoryDistribution = {};
    contributionsList.forEach(contribution => {
      const category = contribution.type || 'General';
      if (!categoryDistribution[category]) {
        categoryDistribution[category] = { name: category, amount: 0, count: 0 };
      }
      categoryDistribution[category].amount += Number(contribution.amount || 0);
      categoryDistribution[category].count += 1;
    });

    const categoryArray = Object.values(categoryDistribution)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    setCategoryData(categoryArray);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const exportContributionReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('Greater Works City Church', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Member Contributions Report', 14, 28);
    
    // Member Info
    doc.setFontSize(12);
    doc.text(`Name: ${member.fullName}`, 14, 40);
    doc.text(`Member ID: ${member.memberId}`, 14, 47);
    doc.text(`Department: ${member.department}`, 14, 54);
    
    // Contribution Stats
    doc.setFontSize(14);
    doc.text('Contribution Statistics', 14, 68);
    doc.setFontSize(10);
    doc.text(`Total Contributions: ${contributionStats.totalContributions}`, 14, 76);
    doc.text(`Total Amount: ${formatCurrency(contributionStats.totalAmount)}`, 14, 83);
    doc.text(`Average Amount: ${formatCurrency(contributionStats.averageAmount)}`, 14, 90);
    doc.text(`This Month: ${formatCurrency(contributionStats.thisMonth)}`, 14, 97);
    doc.text(`This Year: ${formatCurrency(contributionStats.thisYear)}`, 14, 104);
    doc.text(`Monthly Average: ${formatCurrency(contributionStats.monthlyAverage)}`, 14, 111);
    
    // Contribution History Table
    const tableData = contributions.slice(0, 25).map(contribution => [
      format(new Date(contribution.date), 'MMM dd, yyyy'),
      contribution.type || 'General',
      contribution.paymentMethod || 'Cash',
      formatCurrency(contribution.amount),
      contribution.notes || '-'
    ]);
    
    doc.autoTable({
      startY: 120,
      head: [['Date', 'Type', 'Payment Method', 'Amount', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`${member.fullName}_Contributions_Report.pdf`);
    toast.success('Contribution report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate(`/members/${memberId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={exportContributionReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button onClick={() => navigate('/members')} className="hover:text-gray-900">Members</button>
        <span>/</span>
        <button onClick={() => navigate(`/members/${memberId}`)} className="hover:text-gray-900">{member.fullName}</button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Contributions</span>
      </div>

      {/* Member Info Header */}
      <div className="card bg-gradient-to-r from-green-600 to-green-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{member.fullName}</h1>
            <p className="text-white opacity-90">{member.department} • {member.memberId}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{formatCurrency(contributionStats.totalAmount)}</p>
            <p className="text-white opacity-90">Total Contributions</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Time</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Tithe">Tithe</option>
            <option value="Offering">Offering</option>
            <option value="Building Fund">Building Fund</option>
            <option value="Missions">Missions</option>
            <option value="Welfare">Welfare</option>
            <option value="Special">Special</option>
          </select>
        </div>
      </div>

      {/* Contribution Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Total Amount</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(contributionStats.totalAmount)}</p>
              <p className="text-xs text-green-600 mt-1">{contributionStats.totalContributions} contributions</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Average Amount</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(contributionStats.averageAmount)}</p>
              <p className="text-xs text-blue-600 mt-1">Per contribution</p>
            </div>
            <Target className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">This Month</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(contributionStats.thisMonth)}</p>
              <p className="text-xs text-purple-600 mt-1">Monthly average: {formatCurrency(contributionStats.monthlyAverage)}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">This Year</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(contributionStats.thisYear)}</p>
              <p className="text-xs text-orange-600 mt-1">Year to date</p>
            </div>
            <Award className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-teal-50 to-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600 font-semibold">Highest Contribution</p>
              <p className="text-2xl font-bold text-teal-900">{formatCurrency(contributionStats.highestAmount)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-teal-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-600 font-semibold">Lowest Contribution</p>
              <p className="text-2xl font-bold text-pink-900">{formatCurrency(contributionStats.lowestAmount)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-pink-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-semibold">Monthly Average</p>
              <p className="text-2xl font-bold text-indigo-900">{formatCurrency(contributionStats.monthlyAverage)}</p>
            </div>
            <Activity className="w-8 h-8 text-indigo-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Contribution Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-church-gold" />
            Monthly Contribution Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#10B981" name="Amount (GHS)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-church-gold" />
            Contribution by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contribution History */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Receipt className="w-6 h-6 mr-2 text-church-gold" />
          Contribution History
        </h2>
        
        {getFilteredContributions().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No contribution records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredContributions().map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(contribution.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-church-lightGold rounded text-xs font-medium">
                        {contribution.type || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4" />
                        <span>{contribution.paymentMethod || 'Cash'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(contribution.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="truncate max-w-xs block">
                        {contribution.notes || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberContributions;
