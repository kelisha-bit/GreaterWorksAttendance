// CSV Utility Functions for Financial Management

export const toCSV = (headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv' });
};

export const downloadCSV = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return { headers, rows };
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const exportFinancialData = (data, filename, type = 'csv') => {
  if (type === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadCSV(blob, `${filename}.json`);
  } else {
    // Default to CSV
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header] || ''));
    const blob = toCSV(headers, rows);
    downloadCSV(blob, `${filename}.csv`);
  }
};

export const importFinancialData = async (file, mapping = {}) => {
  const text = await file.text();
  const { headers, rows } = parseCSV(text);
  
  // Apply mapping if provided
  const mappedData = rows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      const mappedKey = mapping[header] || header.toLowerCase().replace(/\s+/g, '');
      item[mappedKey] = row[index];
    });
    return item;
  });
  
  return mappedData;
};

// Financial data validation
export const validateTransactionData = (data) => {
  const errors = [];
  
  if (!data.date) errors.push('Date is required');
  if (!data.type || !['income', 'expense'].includes(data.type.toLowerCase())) {
    errors.push('Type must be either income or expense');
  }
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) < 0) {
    errors.push('Amount must be a valid positive number');
  }
  if (!data.category) errors.push('Category is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateBudgetData = (data) => {
  const errors = [];
  
  if (!data.category) errors.push('Category is required');
  if (!data.limitAmount || isNaN(parseFloat(data.limitAmount)) || parseFloat(data.limitAmount) < 0) {
    errors.push('Budget limit must be a valid positive number');
  }
  if (data.alertThreshold && (isNaN(parseFloat(data.alertThreshold)) || parseFloat(data.alertThreshold) < 0 || parseFloat(data.alertThreshold) > 100)) {
    errors.push('Alert threshold must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
