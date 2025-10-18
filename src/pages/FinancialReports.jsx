import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  PieChart,
  BarChart3,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const FinancialReports = () => {
  const { isLeader } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const [stats, setStats] = useState({
    totalContributions: 0,
    totalContributors: 0,
    averageContribution: 0,
    topContributor: null
  });

  const [typeBreakdown, setTypeBreakdown] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (contributions.length > 0) {
      calculateReports();
    }
  }, [contributions, selectedPeriod, selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchContributions(), fetchMembers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'contributions'));
      let contributionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date in JavaScript
      contributionsList.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setContributions(contributionsList);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast.error('Failed to load contributions data');
    }
  };

  const fetchMembers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'members'));
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const filterContributionsByPeriod = () => {
    let filtered = [...contributions];
    const now = new Date();

    switch (selectedPeriod) {
      case 'month':
        if (selectedMonth) {
          filtered = filtered.filter(c => c.date.startsWith(selectedMonth));
        }
        break;
      case 'year':
        filtered = filtered.filter(c => c.date.startsWith(selectedYear));
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStart = currentQuarter * 3;
        filtered = filtered.filter(c => {
          const date = new Date(c.date);
          return date.getFullYear() === now.getFullYear() &&
                 date.getMonth() >= quarterStart &&
                 date.getMonth() < quarterStart + 3;
        });
        break;
      case 'all':
      default:
        // No filtering
        break;
    }

    return filtered;
  };

  const calculateReports = () => {
    const filtered = filterContributionsByPeriod();

    // Overall statistics
    const total = filtered.reduce((sum, c) => sum + c.amount, 0);
    const uniqueContributors = new Set(filtered.map(c => c.memberId));
    const average = filtered.length > 0 ? total / filtered.length : 0;

    // Find top contributor
    const contributorTotals = {};
    filtered.forEach(c => {
      if (!contributorTotals[c.memberId]) {
        contributorTotals[c.memberId] = {
          name: c.memberName,
          total: 0,
          count: 0
        };
      }
      contributorTotals[c.memberId].total += c.amount;
      contributorTotals[c.memberId].count += 1;
    });

    const topContributor = Object.values(contributorTotals).sort((a, b) => b.total - a.total)[0];

    setStats({
      totalContributions: total,
      totalContributors: uniqueContributors.size,
      averageContribution: average,
      topContributor
    });

    // Type breakdown
    const typeBreakdown = {};
    filtered.forEach(c => {
      if (!typeBreakdown[c.contributionType]) {
        typeBreakdown[c.contributionType] = 0;
      }
      typeBreakdown[c.contributionType] += c.amount;
    });

    const typeArray = Object.entries(typeBreakdown).map(([type, amount]) => ({
      type,
      amount,
      percentage: total > 0 ? (amount / total * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);

    setTypeBreakdown(typeArray);

    // Monthly trends (last 12 months)
    const monthlyData = {};
    const last12Months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last12Months.push(key);
      monthlyData[key] = 0;
    }

    contributions.forEach(c => {
      const monthKey = c.date.substring(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += c.amount;
      }
    });

    const monthlyArray = last12Months.map(key => ({
      month: key,
      amount: monthlyData[key],
      label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }));

    setMonthlyTrends(monthlyArray);

    // Top 10 contributors
    const topArray = Object.entries(contributorTotals)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    setTopContributors(topArray);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const exportToCSV = () => {
    const filtered = filterContributionsByPeriod();
    
    const headers = ['Date', 'Member', 'Type', 'Amount', 'Payment Method', 'Notes'];
    const rows = filtered.map(c => [
      c.date,
      c.memberName,
      c.contributionType,
      c.amount,
      c.paymentMethod,
      c.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
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
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Only administrators and leaders can access financial reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <button
          onClick={exportToCSV}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Period Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Report Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              <option value="all">All Time</option>
              <option value="month">Specific Month</option>
              <option value="year">Year</option>
              <option value="quarter">Current Quarter</option>
            </select>
          </div>

          {selectedPeriod === 'month' && (
            <div>
              <label className="label">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {selectedPeriod === 'year' && (
            <div>
              <label className="label">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input-field"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Total Contributions</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalContributions)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Contributors</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalContributors}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Average Contribution</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.averageContribution)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Top Contributor</p>
              <p className="text-lg font-bold text-orange-900 truncate">
                {stats.topContributor?.name || 'N/A'}
              </p>
              {stats.topContributor && (
                <p className="text-sm text-orange-700">{formatCurrency(stats.topContributor.total)}</p>
              )}
            </div>
            <Award className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contribution Type Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-church-gold" />
            <span>Contribution Type Breakdown</span>
          </h2>
          
          {typeBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {typeBreakdown.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.type}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-church-gold rounded-full h-2 transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 10 Contributors */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-church-gold" />
            <span>Top 10 Contributors</span>
          </h2>
          
          {topContributors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
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
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-church-gold" />
          <span>Monthly Trends (Last 12 Months)</span>
        </h2>
        
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="flex items-end space-x-2 h-64">
              {monthlyTrends.map((month, index) => {
                const maxAmount = Math.max(...monthlyTrends.map(m => m.amount));
                const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        {month.amount > 0 ? formatCurrency(month.amount) : ''}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-church-gold to-church-darkGold rounded-t transition-all hover:opacity-80"
                        style={{ height: `${height}%`, minHeight: month.amount > 0 ? '20px' : '0' }}
                        title={`${month.label}: ${formatCurrency(month.amount)}`}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {month.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
