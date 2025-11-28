import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  Download,
  Upload,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  PieChart,
  BarChart3,
  Settings
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
import { listBudgets, createBudget, updateBudget, deleteBudget, getBudgetUtilization, listTransactions } from '../utils/financeService';

const BudgetManagement = () => {
  const { isLeader, currentUser } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [budgetUtilization, setBudgetUtilization] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    category: '',
    limitAmount: '',
    alertThreshold: '80',
    month: selectedMonth,
    description: ''
  });

  // Budget statistics
  const [stats, setStats] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overBudgetCount: 0,
    approachingLimitCount: 0,
    onTrackCount: 0,
    averageUtilization: 0
  });

  // Chart data
  const [utilizationData, setUtilizationData] = useState([]);
  const [spendingTrends, setSpendingTrends] = useState([]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsData, utilizationData, transactionsData] = await Promise.all([
        listBudgets(selectedMonth),
        getBudgetUtilization(selectedMonth),
        listTransactions({ month: selectedMonth })
      ]);
      
      setBudgets(budgetsData);
      setBudgetUtilization(utilizationData);
      setTransactions(transactionsData);
      
      calculateStats(utilizationData);
      prepareChartData(utilizationData, transactionsData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (utilizationData) => {
    const totalBudgeted = utilizationData.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);
    const totalSpent = utilizationData.reduce((sum, b) => sum + Number(b.usedAmount || 0), 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overBudgetCount = utilizationData.filter(b => b.exceeded).length;
    const approachingLimitCount = utilizationData.filter(b => b.approaching && !b.exceeded).length;
    const onTrackCount = utilizationData.filter(b => !b.approaching && !b.exceeded).length;
    const averageUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted * 100) : 0;

    setStats({
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      approachingLimitCount,
      onTrackCount,
      averageUtilization
    });
  };

  const prepareChartData = (utilizationData, transactionsData) => {
    // Utilization chart data
    const utilizationChartData = utilizationData.map(budget => ({
      category: budget.category,
      limit: Number(budget.limitAmount || 0),
      spent: Number(budget.usedAmount || 0),
      remaining: Number(budget.limitAmount || 0) - Number(budget.usedAmount || 0),
      utilization: budget.utilization * 100
    }));

    setUtilizationData(utilizationChartData);

    // Spending trends (last 6 months)
    const trendsData = generateSpendingTrends(transactionsData);
    setSpendingTrends(trendsData);
  };

  const generateSpendingTrends = (transactionsData) => {
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { income: 0, expenses: 0 };
    }
    
    transactionsData.forEach(t => {
      const monthKey = t.date.substring(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        const amount = Number(t.amount || 0);
        if (t.type === 'income') {
          monthlyData[monthKey].income += amount;
        } else {
          monthlyData[monthKey].expenses += amount;
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...data,
      net: data.income - data.expenses
    }));
  };

  const openCreateBudget = () => {
    setSelectedBudget(null);
    setEditMode(false);
    setFormData({
      category: '',
      limitAmount: '',
      alertThreshold: '80',
      month: selectedMonth,
      description: ''
    });
    setShowModal(true);
  };

  const openEditBudget = (budget) => {
    setSelectedBudget(budget);
    setEditMode(true);
    setFormData({
      category: budget.category,
      limitAmount: String(budget.limitAmount || ''),
      alertThreshold: String(budget.alertThreshold || '80'),
      month: budget.month || selectedMonth,
      description: budget.description || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedBudget(null);
  };

  const submitBudget = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.limitAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        category: formData.category,
        limitAmount: parseFloat(formData.limitAmount),
        alertThreshold: parseFloat(formData.alertThreshold),
        month: formData.month,
        description: formData.description
      };

      if (editMode && selectedBudget) {
        await updateBudget(selectedBudget.id, payload, currentUser.email);
        toast.success('Budget updated successfully');
      } else {
        await createBudget(payload, currentUser.email);
        toast.success('Budget created successfully');
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const deleteBudgetItem = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await deleteBudget(budgetId, currentUser.email);
      toast.success('Budget deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
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

  const getBudgetStatus = (budget) => {
    if (budget.exceeded) return { status: 'Over Budget', color: 'red', icon: AlertTriangle };
    if (budget.approaching) return { status: 'Approaching Limit', color: 'yellow', icon: AlertCircle };
    return { status: 'On Track', color: 'green', icon: CheckCircle };
  };

  const exportBudgetReport = () => {
    const reportData = {
      month: selectedMonth,
      budgets: budgetUtilization,
      stats,
      utilizationData,
      spendingTrends,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${selectedMonth}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Budget report exported successfully');
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
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators and leaders can access budget management.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Track and manage church budgets effectively</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field"
          />
          <button
            onClick={exportBudgetReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
          <button
            onClick={openCreateBudget}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Budget</span>
          </button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Budgeted</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(stats.totalBudgeted)}</p>
                <p className="text-sm text-blue-700 mt-2">{budgets.length} categories</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-sm text-red-700 mt-2">{formatPercent(stats.averageUtilization)} utilized</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Remaining</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(stats.totalRemaining)}</p>
                <p className="text-sm text-green-700 mt-2">{stats.onTrackCount} on track</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Alerts</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.overBudgetCount + stats.approachingLimitCount}</p>
                <p className="text-sm text-yellow-700 mt-2">{stats.overBudgetCount} over budget</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-church-gold" />
              <span>Budget Utilization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="limit" fill="#e5e7eb" name="Budget Limit" />
                <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-church-gold" />
              <span>Budget Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="limit"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-church-gold" />
            <span>Budget Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetUtilization.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No budgets set for this month</p>
                <button
                  onClick={openCreateBudget}
                  className="btn-primary mt-4"
                >
                  Create First Budget
                </button>
              </div>
            ) : (
              budgetUtilization.map((budget) => {
                const status = getBudgetStatus(budget);
                const StatusIcon = status.icon;
                
                return (
                  <div key={budget.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-${status.color}-100`}>
                          <StatusIcon className={`w-5 h-5 text-${status.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                          <p className="text-sm text-gray-600">{budget.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                          {status.status}
                        </span>
                        <button
                          onClick={() => openEditBudget(budget)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBudgetItem(budget.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Spent: {formatCurrency(budget.usedAmount)}</span>
                        <span className="text-gray-600">Limit: {formatCurrency(budget.limitAmount)}</span>
                        <span className="font-medium">{formatPercent(budget.utilization * 100)}</span>
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
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Alert threshold: {formatPercent((budget.alertThreshold || 0.8) * 100)}</span>
                        <span>Remaining: {formatCurrency(budget.limitAmount - budget.usedAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-church-gold" />
            <span>Spending Trends (Last 6 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
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

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? 'Edit Budget' : 'Create Budget'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={submitBudget} className="p-6 space-y-4">
              <div>
                <label className="label">Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Utilities, Staff, Events"
                  required
                />
              </div>
              
              <div>
                <label className="label">Budget Limit (GHS) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.limitAmount}
                  onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="label">Alert Threshold (%)</label>
                <select
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  className="input-field"
                >
                  <option value="50">50% - Early Warning</option>
                  <option value="70">70% - Caution</option>
                  <option value="80">80% - Standard</option>
                  <option value="90">90% - Critical</option>
                </select>
              </div>
              
              <div>
                <label className="label">Month</label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Optional description for this budget category"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
