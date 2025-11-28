import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';

export const listTransactions = async (filters = {}) => {
  const ref = collection(db, 'transactions');
  const snapshot = await getDocs(ref);
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  if (filters.type && filters.type !== 'all') items = items.filter(x => x.type === filters.type);
  if (filters.category && filters.category !== 'all') items = items.filter(x => x.category === filters.category);
  if (filters.month) items = items.filter(x => String(x.date).startsWith(filters.month));
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  return items;
};

export const createTransaction = async (data, actorEmail) => {
  const payload = { ...data, recordedBy: actorEmail, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'posted' };
  const res = await addDoc(collection(db, 'transactions'), payload);
  await logAudit('create', 'transaction', res.id, { payload });
  return res.id;
};

export const updateTransaction = async (id, data, actorEmail) => {
  const payload = { ...data, recordedBy: actorEmail, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, 'transactions', id), payload);
  await logAudit('update', 'transaction', id, { payload });
};

export const deleteTransaction = async (id, actorEmail) => {
  await deleteDoc(doc(db, 'transactions', id));
  await logAudit('delete', 'transaction', id, { actorEmail });
};

export const listBudgets = async (month) => {
  const ref = collection(db, 'budgets');
  const snapshot = await getDocs(ref);
  let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  if (month) items = items.filter(x => x.month === month);
  items.sort((a, b) => a.category.localeCompare(b.category));
  return items;
};

export const createBudget = async (data, actorEmail) => {
  const payload = { ...data, createdBy: actorEmail, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const res = await addDoc(collection(db, 'budgets'), payload);
  await logAudit('create', 'budget', res.id, { payload });
  return res.id;
};

export const updateBudget = async (id, data, actorEmail) => {
  const payload = { ...data, updatedAt: new Date().toISOString(), createdBy: data.createdBy || actorEmail };
  await updateDoc(doc(db, 'budgets', id), payload);
  await logAudit('update', 'budget', id, { payload });
};

export const deleteBudget = async (id, actorEmail) => {
  await deleteDoc(doc(db, 'budgets', id));
  await logAudit('delete', 'budget', id, { actorEmail });
};

export const getBudgetUtilization = async (month) => {
  const budgets = await listBudgets(month);
  const txs = await listTransactions({ month });
  const usedByCat = {};
  txs.forEach(t => {
    if (!usedByCat[t.category]) usedByCat[t.category] = 0;
    if (t.type === 'expense') usedByCat[t.category] += Number(t.amount) || 0;
  });
  return budgets.map(b => {
    const used = usedByCat[b.category] || 0;
    const utilization = b.limitAmount > 0 ? (used / b.limitAmount) : 0;
    const approaching = utilization >= (Number(b.alertThreshold || 0.8));
    const exceeded = used > b.limitAmount;
    return { ...b, usedAmount: used, utilization, approaching, exceeded };
  });
};

export const logAudit = async (action, entityType, entityId, details = {}) => {
  const payload = { action, entityType, entityId, details, timestamp: new Date().toISOString() };
  await addDoc(collection(db, 'audit_logs'), payload);
};

