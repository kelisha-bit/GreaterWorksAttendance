import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Download,
  PieChart,
  BarChart3,
  Award,
  Target,
  AlertTriangle,
  CreditCard,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
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
import { listTransactions, getBudgetUtilization } from '../utils/financeService';

const FinanceDashboard = () => {
  const { isLeader, currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Financial metrics
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    averageMonthlyIncome: 0,
    averageMonthlyExpenses: 0,
    savingsRate: 0,
    budgetUtilization: 0,
    transactionCount: 0
  });

  // Chart data
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [incomeVsExpenses, setIncomeVsExpenses] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, budgetsData] = await Promise.all([
        listTransactions({}),
        getBudgetUtilization(selectedMonth)
      ]);
      
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      
      // Apply period filtering to transactions
      const filteredTransactions = filterTransactionsByPeriod(transactionsData);
      
      calculateMetrics(filteredTransactions);
      prepareChartData(filteredTransactions);
      setBudgetStatus(budgetsData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByPeriod = (transactionsData) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    let startDate, endDate;
    
    if (selectedPeriod === 'month') {
      startDate = new Date(selectedMonth + '-01');
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    } else if (selectedPeriod === 'quarter') {
      const quarterStart = (currentQuarter - 1) * 3 + 1;
      startDate = new Date(currentYear, quarterStart - 1, 1);
      endDate = new Date(currentYear, quarterStart + 2, 0);
    } else {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    }
    
    return transactionsData.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
  };

  const calculateMetrics = (transactionsData) => {
    const income = transactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const expenses = transactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const net = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0;
    
    // Calculate monthly averages
    const monthlyData = {};
    transactionsData.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].income += Number(t.amount || 0);
      } else {
        monthlyData[month].expenses += Number(t.amount || 0);
      }
    });
    
    const months = Object.keys(monthlyData);
    const avgIncome = months.length > 0 ? 
      months.reduce((sum, month) => sum + monthlyData[month].income, 0) / months.length : 0;
    const avgExpenses = months.length > 0 ? 
      months.reduce((sum, month) => sum + monthlyData[month].expenses, 0) / months.length : 0;
    
    // Budget utilization
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);
    const totalBudgetUsed = budgets.reduce((sum, b) => sum + Number(b.usedAmount || 0), 0);
    const budgetUtil = totalBudgetLimit > 0 ? (totalBudgetUsed / totalBudgetLimit * 100) : 0;
    
    setMetrics({
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: net,
      averageMonthlyIncome: avgIncome,
      averageMonthlyExpenses: avgExpenses,
      savingsRate: savingsRate,
      budgetUtilization: budgetUtil,
      transactionCount: transactionsData.length
    });
  };

  const prepareChartData = (transactionsData) => {
    // Monthly trends (last 12 months)
    const monthlyData = {};
    const last12Months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last12Months.push(key);
      monthlyData[key] = { income: 0, expenses: 0, net: 0 };
    }
    
    transactionsData.forEach(t => {
      const monthKey = t.date.substring(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        const amount = Number(t.amount || 0);
        if (t.type === 'income') {
          monthlyData[monthKey].income += amount;
          monthlyData[monthKey].net += amount;
        } else {
          monthlyData[monthKey].expenses += amount;
          monthlyData[monthKey].net -= amount;
        }
      }
    });
    
    const trendsArray = last12Months.map(key => ({
      month: key,
      label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      income: monthlyData[key].income,
      expenses: monthlyData[key].expenses,
      net: monthlyData[key].net
    }));
    
    setMonthlyTrends(trendsArray);
    
    // Category breakdown (for selected period only)
    const categoryData = {};
    transactionsData.forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = { income: 0, expenses: 0, total: 0 };
      }
      const amount = Number(t.amount || 0);
      if (t.type === 'income') {
        categoryData[t.category].income += amount;
        categoryData[t.category].total += amount;
      } else {
        categoryData[t.category].expenses += amount;
        categoryData[t.category].total += amount;
      }
    });
    
    const categoryArray = Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        income: data.income,
        expenses: data.expenses,
        total: data.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    
    setCategoryBreakdown(categoryArray);
    
    // Income vs Expenses comparison
    setIncomeVsExpenses(trendsArray);
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

  const getTrendIcon = (value) => {
    return value >= 0 ? 
      <ArrowUpRight className="w-4 h-4 text-green-600" /> : 
      <ArrowDownRight className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = (value) => {
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
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators and leaders can access financial dashboard.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of church financial health</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field"
          >
            <option value="month">Monthly View</option>
            <option value="quarter">Quarterly View</option>
            <option value="year">Yearly View</option>
          </select>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Income</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(metrics.totalIncome)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getTrendIcon(metrics.totalIncome)}
                  <span className={`text-sm ${getTrendColor(metrics.totalIncome)}`}>
                    {formatPercent(metrics.savingsRate)} savings rate
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(metrics.totalExpenses)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  <span className="text-sm text-red-600">
                    {metrics.transactionCount} transactions
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Net Income</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(metrics.netIncome)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  {getTrendIcon(metrics.netIncome)}
                  <span className={`text-sm ${getTrendColor(metrics.netIncome)}`}>
                    Monthly avg: {formatCurrency(metrics.averageMonthlyIncome)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Budget Utilization</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{formatPercent(metrics.budgetUtilization)}</p>
                <div className="flex items-center mt-2 space-x-1">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-600">
                    {budgets.filter(b => b.exceeded).length} over budget
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-church-gold" />
              <span>Monthly Financial Trends</span>
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
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-church-gold" />
              <span>Expense Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="expenses"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-church-gold" />
            <span>Income vs Expenses Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" />
              <Bar dataKey="expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-church-gold" />
            <span>Budget Status Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetStatus.slice(0, 5).map((budget, index) => (
              <div key={budget.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{budget.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      budget.exceeded ? 'bg-red-100 text-red-700' :
                      budget.approaching ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {budget.exceeded ? 'Over Budget' : 
                       budget.approaching ? 'Approaching Limit' : 
                       'On Track'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        budget.exceeded ? 'bg-red-500' :
                        budget.approaching ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.utilization * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>{formatCurrency(budget.usedAmount)} spent</span>
                    <span>{formatCurrency(budget.limitAmount)} limit</span>
                  </div>
                </div>
                {budget.exceeded && (
                  <AlertTriangle className="w-5 h-5 text-red-500 ml-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;
