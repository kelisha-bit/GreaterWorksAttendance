import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Search, Edit2, Trash2, X, Plus, Download, Upload, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../utils/financeService';
import { toCSV, downloadCSV, parseCSV } from '../utils/csvUtils';

const Transactions = () => {
  const { isLeader, currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({ type: 'income', amount: '', date: new Date().toISOString().split('T')[0], category: '', description: '', paymentMethod: 'Cash' });

  const [categories, setCategories] = useState([]);
  const methods = ['Cash', 'Mobile Money', 'Bank Transfer', 'Check', 'Card'];

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { applyFilters(); }, [searchTerm, transactions, filterType, filterCategory, filterMonth]);

  const fetchAll = async () => {
    try {
      const items = await listTransactions({});
      setTransactions(items);
      setFiltered(items);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { listCategories } = await import('../utils/categoryService');
      const cats = await listCategories();
      setCategories(cats);
    } catch (e) { console.error('Failed to load categories', e); }
  };

  const applyFilters = () => {
    let items = [...transactions];
    if (searchTerm) items = items.filter(t => String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(t.category || '').toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType !== 'all') items = items.filter(t => t.type === filterType);
    if (filterCategory !== 'all') items = items.filter(t => t.category === filterCategory);
    if (filterMonth) items = items.filter(t => String(t.date).startsWith(filterMonth));
    setFiltered(items);
  };

  const openCreate = () => { setSelected(null); setEditMode(false); setFormData({ type: 'income', amount: '', date: new Date().toISOString().split('T')[0], category: '', description: '', paymentMethod: 'Cash' }); setShowModal(true); };

  const openEdit = (item) => { setSelected(item); setEditMode(true); setFormData({ type: item.type, amount: String(item.amount), date: item.date, category: item.category || '', description: item.description || '', paymentMethod: item.paymentMethod || 'Cash' }); setShowModal(true); };

  const closeModal = () => { setShowModal(false); setEditMode(false); setSelected(null); };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.date || !formData.category || !formData.type) { toast.error('Fill all required fields'); return; }
    try {
      const selectedCat = categories.find(c => c.name === formData.category);
      const payload = { type: formData.type, amount: parseFloat(formData.amount), date: formData.date, category: formData.category, categoryId: selectedCat?.id || null, description: formData.description, paymentMethod: formData.paymentMethod };
      if (editMode && selected) { await updateTransaction(selected.id, payload, currentUser.email); toast.success('Transaction updated'); }
      else { await createTransaction(payload, currentUser.email); toast.success('Transaction recorded'); }
      await fetchAll();
      closeModal();
    } catch (e) {
      toast.error('Failed to save transaction');
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try { await deleteTransaction(id, currentUser.email); toast.success('Transaction deleted'); await fetchAll(); } catch { toast.error('Failed to delete'); }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Description'];
    const rows = filtered.map(t => [t.date, t.type, t.category, t.amount, t.paymentMethod || '', t.description || '']);
    const blob = toCSV(headers, rows);
    downloadCSV(blob, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Exported');
  };

  const importCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const { headers, rows } = parseCSV(text);
    const idx = {
      date: headers.findIndex(h => h.toLowerCase().includes('date')),
      type: headers.findIndex(h => h.toLowerCase().includes('type')),
      category: headers.findIndex(h => h.toLowerCase().includes('category')),
      amount: headers.findIndex(h => h.toLowerCase().includes('amount')),
      method: headers.findIndex(h => h.toLowerCase().includes('method')),
      desc: headers.findIndex(h => h.toLowerCase().includes('description'))
    };
    let count = 0;
    for (const r of rows) {
      const payload = {
        date: r[idx.date] || new Date().toISOString().split('T')[0],
        type: (r[idx.type] || 'income').toLowerCase() === 'expense' ? 'expense' : 'income',
        category: r[idx.category] || 'Other',
        amount: parseFloat(r[idx.amount] || '0'),
        paymentMethod: r[idx.method] || 'Cash',
        description: r[idx.desc] || ''
      };
      try { await createTransaction(payload, currentUser.email); count++; } catch (e) { console.error(e); }
    }
    toast.success(`Imported ${count} transactions`);
    await fetchAll();
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" /></div>);
  if (!isLeader) return (<div className="card text-center py-12"><DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" /><h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2><p className="text-gray-600">Only administrators and leaders can access financial transactions.</p></div>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="btn-secondary flex items-center justify-center space-x-2 cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => importCSV(e.target.files[0])} />
          </label>
          <button onClick={exportCSV} className="btn-secondary flex items-center justify-center space-x-2"><Download className="w-5 h-5" /><span>Export CSV</span></button>
          <button onClick={openCreate} className="btn-primary flex items-center justify-center space-x-2"><Plus className="w-5 h-5" /><span>Add Transaction</span></button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by description or category" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-10" />
          </div>
          <div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field">
              <option value="all">All Categories</option>
              {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100"><div className="flex items-center justify-between"><div><p className="text-sm text-green-600 font-semibold">Total Income</p><p className="text-2xl font-bold text-green-900">{formatCurrency(filtered.filter(t => t.type==='income').reduce((s,x)=>s+Number(x.amount||0),0))}</p></div><DollarSign className="w-8 h-8 text-green-600 opacity-50" /></div></div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100"><div className="flex items-center justify-between"><div><p className="text-sm text-red-600 font-semibold">Total Expense</p><p className="text-2xl font-bold text-red-900">{formatCurrency(filtered.filter(t => t.type==='expense').reduce((s,x)=>s+Number(x.amount||0),0))}</p></div><DollarSign className="w-8 h-8 text-red-600 opacity-50" /></div></div>
        <div className="card bg-gradient-to-br from-church-gold to-church-darkGold text-white"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold opacity-90">Net</p><p className="text-2xl font-bold">{formatCurrency(filtered.reduce((s,x)=>s+(x.type==='income'?Number(x.amount||0):-Number(x.amount||0)),0))}</p></div><TrendingUp className="w-8 h-8 opacity-50" /></div></div>
      </div>

      <div className="card">
        <div className="mb-4"><h2 className="text-lg font-semibold text-gray-900">All Transactions ({filtered.length})</h2></div>
        {filtered.length===0 ? (<div className="text-center py-12 text-gray-500"><DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg">No transactions found</p></div>) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs ${item.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{item.type}</span></td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.category}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-sm"><div className="flex items-center space-x-2"><button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button><button onClick={() => removeItem(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editMode ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={submitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Type *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field" required>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field" required>
                    <option value="">Choose...</option>
                    {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (GHS) *</label>
                  <input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-field" required placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Payment Method *</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="input-field" required>
                    {methods.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows="3" placeholder="Details" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={closeModal} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editMode ? 'Update' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
