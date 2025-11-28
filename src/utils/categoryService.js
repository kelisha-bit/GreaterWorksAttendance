import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Default financial categories
const DEFAULT_CATEGORIES = [
  { name: 'Tithes', type: 'income', description: 'Member tithes and offerings' },
  { name: 'Offerings', type: 'income', description: 'General offerings and donations' },
  { name: 'Special Offerings', type: 'income', description: 'Special collections and campaigns' },
  { name: 'Building Fund', type: 'income', description: 'Building and construction donations' },
  { name: 'Mission Support', type: 'income', description: 'Mission and outreach donations' },
  { name: 'Staff Salaries', type: 'expense', description: 'Pastoral and support staff compensation' },
  { name: 'Utilities', type: 'expense', description: 'Electricity, water, internet, etc.' },
  { name: 'Building Maintenance', type: 'expense', description: 'Repairs and maintenance' },
  { name: 'Office Supplies', type: 'expense', description: 'Administrative supplies' },
  { name: 'Events', type: 'expense', description: 'Church events and programs' },
  { name: 'Outreach', type: 'expense', description: 'Community outreach programs' },
  { name: 'Communication', type: 'expense', description: 'Phone, internet, marketing' },
  { name: 'Insurance', type: 'expense', description: 'Church insurance premiums' },
  { name: 'Transportation', type: 'expense', description: 'Vehicle and travel expenses' },
  { name: 'Other', type: 'expense', description: 'Miscellaneous expenses' }
];

export const listCategories = async () => {
  try {
    const ref = collection(db, 'categories');
    const snapshot = await getDocs(ref);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // If no categories exist, initialize with defaults
    if (categories.length === 0) {
      await initializeDefaultCategories();
      return await listCategories(); // Recursive call to get the newly created categories
    }
    
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error listing categories:', error);
    // Return default categories if Firebase fails
    return DEFAULT_CATEGORIES.map((cat, index) => ({ ...cat, id: `default-${index}` }));
  }
};

export const createCategory = async (categoryData, actorEmail) => {
  try {
    const payload = {
      ...categoryData,
      createdBy: actorEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const ref = collection(db, 'categories');
    const result = await addDoc(ref, payload);
    
    await logAudit('create', 'category', result.id, { payload });
    return result.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData, actorEmail) => {
  try {
    const payload = {
      ...categoryData,
      updatedBy: actorEmail,
      updatedAt: new Date().toISOString()
    };
    
    const ref = doc(db, 'categories', id);
    await updateDoc(ref, payload);
    
    await logAudit('update', 'category', id, { payload });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id, actorEmail) => {
  try {
    const ref = doc(db, 'categories', id);
    await deleteDoc(ref);
    
    await logAudit('delete', 'category', id, { actorEmail });
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const getCategoryByName = async (name) => {
  try {
    const categories = await listCategories();
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  } catch (error) {
    console.error('Error getting category by name:', error);
    return null;
  }
};

export const getCategoriesByType = async (type) => {
  try {
    const categories = await listCategories();
    return categories.filter(cat => cat.type === type);
  } catch (error) {
    console.error('Error getting categories by type:', error);
    return [];
  }
};

export const initializeDefaultCategories = async () => {
  try {
    for (const category of DEFAULT_CATEGORIES) {
      await createCategory(category, 'system@greaterworks.com');
    }
    console.log('Default categories initialized successfully');
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};

export const getCategoryStats = async () => {
  try {
    const categories = await listCategories();
    const { listTransactions } = await import('./financeService');
    const transactions = await listTransactions({});
    
    const stats = categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category === category.name);
      const income = categoryTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const expenses = categoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      return {
        ...category,
        transactionCount: categoryTransactions.length,
        totalIncome: income,
        totalExpenses: expenses,
        net: income - expenses
      };
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting category stats:', error);
    return [];
  }
};

export const validateCategoryData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Category name is required');
  }
  
  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.push('Category type must be either income or expense');
  }
  
  if (data.name && data.name.length > 50) {
    errors.push('Category name must be less than 50 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Audit logging
const logAudit = async (action, entityType, entityId, details = {}) => {
  try {
    const payload = {
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    
    const ref = collection(db, 'audit_logs');
    await addDoc(ref, payload);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

export default {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryByName,
  getCategoriesByType,
  initializeDefaultCategories,
  getCategoryStats,
  validateCategoryData
};
