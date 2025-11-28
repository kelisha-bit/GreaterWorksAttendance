import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import { listTransactions } from '../utils/financeService';

const FinancialAnalytics = () => {
  const { isLeader, currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');
  const [comparisonMode, setComparisonMode] = useState('year-over-year');
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    currentPeriod: { income: 0, expenses: 0, net: 0, transactions: 0 },
    previousPeriod: { income: 0, expenses: 0, net: 0, transactions: 0 },
    growth: { income: 0, expenses: 0, net: 0, transactions: 0 },
    averages: { monthlyIncome: 0, monthlyExpenses: 0, savingsRate: 0 },
    projections: { yearEndIncome: 0, yearEndExpenses: 0, yearEndNet: 0 }
  });

  // Chart data
  const [trendData, setTrendData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [categoryTrends, setCategoryTrends] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedYear, selectedQuarter, comparisonMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const transactionsData = await listTransactions({});
      setTransactions(transactionsData);
      
      calculateAnalytics(transactionsData);
      prepareChartData(transactionsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (transactionsData) => {
    const currentPeriodData = filterTransactionsByPeriod(transactionsData, 'current');
    const previousPeriodData = filterTransactionsByPeriod(transactionsData, 'previous');
    
    const currentStats = calculatePeriodStats(currentPeriodData);
    const previousStats = calculatePeriodStats(previousPeriodData);
    
    // Calculate growth rates
    const growth = {
      income: previousStats.income > 0 ? ((currentStats.income - previousStats.income) / previousStats.income * 100) : 0,
      expenses: previousStats.expenses > 0 ? ((currentStats.expenses - previousStats.expenses) / previousStats.expenses * 100) : 0,
      net: previousStats.net !== 0 ? ((currentStats.net - previousStats.net) / Math.abs(previousStats.net) * 100) : 0,
      transactions: previousStats.transactions > 0 ? ((currentStats.transactions - previousStats.transactions) / previousStats.transactions * 100) : 0
    };
    
    // Calculate averages
    const monthlyData = getMonthlyData(transactionsData);
    const months = Object.keys(monthlyData);
    const averages = {
      monthlyIncome: months.length > 0 ? months.reduce((sum, month) => sum + monthlyData[month].income, 0) / months.length : 0,
      monthlyExpenses: months.length > 0 ? months.reduce((sum, month) => sum + monthlyData[month].expenses, 0) / months.length : 0,
      savingsRate: currentStats.income > 0 ? ((currentStats.income - currentStats.expenses) / currentStats.income * 100) : 0
    };
    
    // Calculate projections
    const projections = calculateProjections(transactionsData, currentStats);
    
    setAnalytics({
      currentPeriod: currentStats,
      previousPeriod: previousStats,
      growth,
      averages,
      projections
    });
  };

  const filterTransactionsByPeriod = (transactionsData, period) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    let startDate, endDate;
    
    if (period === 'current') {
      if (selectedPeriod === 'month') {
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0);
      } else if (selectedPeriod === 'quarter') {
        const quarterStart = (parseInt(selectedQuarter) - 1) * 3 + 1;
        startDate = new Date(parseInt(selectedYear), quarterStart - 1, 1);
        endDate = new Date(parseInt(selectedYear), quarterStart + 2, 0);
      } else {
        startDate = new Date(parseInt(selectedYear), 0, 1);
        endDate = new Date(parseInt(selectedYear), 11, 31);
      }
    } else {
      // Previous period
      if (selectedPeriod === 'month') {
        const prevMonth = selectedMonth - 1 || 12;
        const prevYear = prevMonth === 12 ? parseInt(selectedYear) - 1 : parseInt(selectedYear);
        startDate = new Date(prevYear, prevMonth - 1, 1);
        endDate = new Date(prevYear, prevMonth, 0);
      } else if (selectedPeriod === 'quarter') {
        const prevQuarter = parseInt(selectedQuarter) - 1 || 4;
        const prevYear = prevQuarter === 4 ? parseInt(selectedYear) - 1 : parseInt(selectedYear);
        const quarterStart = (prevQuarter - 1) * 3 + 1;
        startDate = new Date(prevYear, quarterStart - 1, 1);
        endDate = new Date(prevYear, quarterStart + 2, 0);
      } else {
        startDate = new Date(parseInt(selectedYear) - 1, 0, 1);
        endDate = new Date(parseInt(selectedYear) - 1, 11, 31);
      }
    }
    
    return transactionsData.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
  };

  const calculatePeriodStats = (transactionsData) => {
    const income = transactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const expenses = transactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    return {
      income,
      expenses,
      net: income - expenses,
      transactions: transactionsData.length
    };
  };

  const getMonthlyData = (transactionsData) => {
    const monthlyData = {};
    transactionsData.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      const amount = Number(t.amount || 0);
      if (t.type === 'income') {
        monthlyData[month].income += amount;
      } else {
        monthlyData[month].expenses += amount;
      }
    });
    return monthlyData;
  };

  const calculateProjections = (transactionsData, currentStats) => {
    if (selectedPeriod === 'year') {
      // Already at year level, no projection needed
      return {
        yearEndIncome: currentStats.income,
        yearEndExpenses: currentStats.expenses,
        yearEndNet: currentStats.net
      };
    }
    
    const currentYear = parseInt(selectedYear);
    const yearTransactions = transactionsData.filter(t => t.date.startsWith(currentYear.toString()));
    const yearToDate = new Date();
    const monthsPassed = yearToDate.getMonth() + 1;
    
    const ytdIncome = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const ytdExpenses = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const monthlyAvgIncome = monthsPassed > 0 ? ytdIncome / monthsPassed : 0;
    const monthlyAvgExpenses = monthsPassed > 0 ? ytdExpenses / monthsPassed : 0;
    
    return {
      yearEndIncome: monthlyAvgIncome * 12,
      yearEndExpenses: monthlyAvgExpenses * 12,
      yearEndNet: (monthlyAvgIncome - monthlyAvgExpenses) * 12
    };
  };

  const prepareChartData = (transactionsData) => {
    // Trend data for current period
    const trendData = generateTrendData(transactionsData);
    setTrendData(trendData);
    
    // Comparison data
    const comparisonData = generateComparisonData(transactionsData);
    setComparisonData(comparisonData);
    
    // Monthly breakdown
    const monthlyData = generateMonthlyBreakdown(transactionsData);
    setMonthlyBreakdown(monthlyData);
    
    // Category trends
    const categoryData = generateCategoryTrends(transactionsData);
    setCategoryTrends(categoryData);
  };

  const generateTrendData = (transactionsData) => {
    const currentPeriodData = filterTransactionsByPeriod(transactionsData, 'current');
    const trendMap = {};
    
    if (selectedPeriod === 'month') {
      // Daily trends for the month
      const daysInMonth = new Date(parseInt(selectedYear), selectedMonth, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        trendMap[date] = { income: 0, expenses: 0, net: 0 };
      }
      
      currentPeriodData.forEach(t => {
        const date = t.date;
        const amount = Number(t.amount || 0);
        if (!trendMap[date]) trendMap[date] = { income: 0, expenses: 0, net: 0 };
        
        if (t.type === 'income') {
          trendMap[date].income += amount;
          trendMap[date].net += amount;
        } else {
          trendMap[date].expenses += amount;
          trendMap[date].net -= amount;
        }
      });
    } else if (selectedPeriod === 'quarter') {
      // Weekly trends for the quarter
      const quarterStart = (parseInt(selectedQuarter) - 1) * 3 + 1;
      const startDate = new Date(parseInt(selectedYear), quarterStart - 1, 1);
      const endDate = new Date(parseInt(selectedYear), quarterStart + 2, 0);
      
      const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekKey = `Week ${i + 1}`;
        trendMap[weekKey] = { income: 0, expenses: 0, net: 0 };
      }
      
      currentPeriodData.forEach(t => {
        const date = new Date(t.date);
        const weekIndex = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
        const weekKey = `Week ${weekIndex + 1}`;
        const amount = Number(t.amount || 0);
        
        if (trendMap[weekKey]) {
          if (t.type === 'income') {
            trendMap[weekKey].income += amount;
            trendMap[weekKey].net += amount;
          } else {
            trendMap[weekKey].expenses += amount;
            trendMap[weekKey].net -= amount;
          }
        }
      });
    } else {
      // Monthly trends for the year
      for (let i = 1; i <= 12; i++) {
        const month = `${selectedYear}-${String(i).padStart(2, '0')}`;
        trendMap[month] = { income: 0, expenses: 0, net: 0 };
      }
      
      currentPeriodData.forEach(t => {
        const month = t.date.substring(0, 7);
        const amount = Number(t.amount || 0);
        
        if (trendMap[month]) {
          if (t.type === 'income') {
            trendMap[month].income += amount;
            trendMap[month].net += amount;
          } else {
            trendMap[month].expenses += amount;
            trendMap[month].net -= amount;
          }
        }
      });
    }
    
    return Object.entries(trendMap).map(([key, data]) => ({
      period: key,
      ...data
    }));
  };

  const generateComparisonData = (transactionsData) => {
    const currentData = filterTransactionsByPeriod(transactionsData, 'current');
    const previousData = filterTransactionsByPeriod(transactionsData, 'previous');
    
    return [
      {
        period: 'Previous Period',
        income: previousData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0),
        expenses: previousData.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      },
      {
        period: 'Current Period',
        income: currentData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0),
        expenses: currentData.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      }
    ];
  };

  const generateMonthlyBreakdown = (transactionsData) => {
    const monthlyData = {};
    const year = selectedPeriod === 'year' ? selectedYear : new Date().getFullYear().toString();
    
    for (let i = 1; i <= 12; i++) {
      const month = `${year}-${String(i).padStart(2, '0')}`;
      monthlyData[month] = { income: 0, expenses: 0, net: 0 };
    }
    
    transactionsData.forEach(t => {
      if (t.date.startsWith(year)) {
        const month = t.date.substring(0, 7);
        const amount = Number(t.amount || 0);
        
        if (monthlyData[month]) {
          if (t.type === 'income') {
            monthlyData[month].income += amount;
            monthlyData[month].net += amount;
          } else {
            monthlyData[month].expenses += amount;
            monthlyData[month].net -= amount;
          }
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      ...data
    }));
  };

  const generateCategoryTrends = (transactionsData) => {
    const categoryData = {};
    
    transactionsData.forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = { income: 0, expenses: 0 };
      }
      const amount = Number(t.amount || 0);
      if (t.type === 'income') {
        categoryData[t.category].income += amount;
      } else {
        categoryData[t.category].expenses += amount;
      }
    });
    
    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        ...data,
        total: data.income + data.expenses
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value) => {
    return value >= 0 ? 
      <ArrowUpRight className="w-4 h-4 text-green-600" /> : 
      <ArrowDownRight className="w-4 h-4 text-red-600" />;
  };

  const getGrowthColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const exportAnalytics = () => {
    const reportData = {
      period: selectedPeriod,
      year: selectedYear,
      analytics,
      trendData,
      comparisonData,
      monthlyBreakdown,
      categoryTrends,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-analytics-${selectedYear}-${selectedPeriod}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully');
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
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators and leaders can access financial analytics.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600 mt-1">Deep insights into church financial performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field"
          >
            <option value="month">Monthly Analysis</option>
            <option value="quarter">Quarterly Analysis</option>
            <option value="year">Yearly Analysis</option>
          </select>
          {selectedPeriod !== 'year' && (
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
          )}
          {selectedPeriod === 'quarter' && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="input-field"
            >
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
            </select>
          )}
          <button
            onClick={exportAnalytics}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Period Income</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.currentPeriod.income)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getGrowthIcon(analytics.growth.income)}
                  <span className={`text-sm ${getGrowthColor(analytics.growth.income)}`}>
                    {formatPercent(analytics.growth.income)} vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Period Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.currentPeriod.expenses)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getGrowthIcon(-analytics.growth.expenses)}
                  <span className={`text-sm ${getGrowthColor(-analytics.growth.expenses)}`}>
                    {formatPercent(analytics.growth.expenses)} vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.currentPeriod.net)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getGrowthIcon(analytics.growth.net)}
                  <span className={`text-sm ${getGrowthColor(analytics.growth.net)}`}>
                    {formatPercent(analytics.growth.net)} vs previous
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Savings Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatPercent(analytics.averages.savingsRate)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-600">
                    Monthly avg: {formatCurrency(analytics.averages.monthlyIncome)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-church-gold" />
              <span>Financial Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-church-gold" />
              <span>Period Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" />
                <Bar dataKey="expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-church-gold" />
            <span>Monthly Performance Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" />
              <Bar dataKey="expenses" fill="#ef4444" />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-church-gold" />
            <span>Category Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryTrends.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Income: {formatCurrency(category.income)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Expenses: {formatCurrency(category.expenses)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(category.total)}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-church-gold" />
            <span>Year-End Projections</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Projected Income</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(analytics.projections.yearEndIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Projected Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(analytics.projections.yearEndExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Projected Net</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(analytics.projections.yearEndNet)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialAnalytics;
