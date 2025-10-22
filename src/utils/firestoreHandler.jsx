import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  onSnapshot,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  doc,
  getDoc
} from 'firebase/firestore';

// Cache duration in milliseconds (default: 30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Connection status tracking
let connectionStatus = 'online';
const connectionListeners = [];

/**
 * Set connection status and notify listeners
 * @param {string} status - 'online' or 'offline'
 */
export const setConnectionStatus = (status) => {
  if (connectionStatus !== status) {
    connectionStatus = status;
    // Notify all listeners
    connectionListeners.forEach(listener => listener(status));
  }
};

/**
 * Get current connection status
 * @returns {string} - 'online' or 'offline'
 */
export const getConnectionStatus = () => connectionStatus;

/**
 * Add connection status listener
 * @param {Function} listener - Function to call when connection status changes
 * @returns {Function} - Function to remove listener
 */
export const addConnectionListener = (listener) => {
  connectionListeners.push(listener);
  // Immediately call with current status
  listener(connectionStatus);
  
  return () => {
    const index = connectionListeners.indexOf(listener);
    if (index > -1) {
      connectionListeners.splice(index, 1);
    }
  };
};

// Setup network status monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setConnectionStatus('online'));
  window.addEventListener('offline', () => setConnectionStatus('offline'));
  
  // Set initial status
  setConnectionStatus(navigator.onLine ? 'online' : 'offline');
}

/**
 * Safe query execution with error handling and offline support
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options
 * @param {string} options.whereField - Field name for where clause
 * @param {string} options.whereOp - Comparison operator for where clause
 * @param {any} options.whereValue - Value for where clause
 * @param {string} options.orderByField - Field name for ordering
 * @param {string} options.orderDirection - 'asc' or 'desc'
 * @param {number} options.limitCount - Maximum number of documents to return
 * @param {DocumentSnapshot} options.startAfterDoc - Document to start after for pagination
 * @param {DocumentSnapshot} options.endBeforeDoc - Document to end before for pagination
 * @param {boolean} options.useCache - Whether to use cached data when offline
 * @returns {Promise<{data: Array, error: Error}>} - Query results and any error
 */
export const safeQuery = async (collectionName, options = {}) => {
  const {
    whereField,
    whereOp = '==',
    whereValue,
    orderByField,
    orderDirection = 'asc',
    limitCount,
    startAfterDoc,
    endBeforeDoc,
    useCache = true
  } = options;

  try {
    let q = collection(db, collectionName);
    
    // Apply where clause if provided
    if (whereField && whereValue !== undefined) {
      q = query(q, where(whereField, whereOp, whereValue));
    }
    
    // Apply ordering if specified
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // Apply limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    // Apply pagination cursors
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    } else if (endBeforeDoc) {
      q = query(q, endBefore(endBeforeDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const data = [];
    
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    return { data: [], error };
  }
};

/**
 * Safe document retrieval with error handling and offline support
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {boolean} useCache - Whether to use cached data when offline
 * @returns {Promise<{data: Object|null, error: Error}>} - Document data and any error
 */
export const safeGetDoc = async (collectionName, docId, useCache = true) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        data: { 
          id: docSnap.id, 
          ...docSnap.data() 
        }, 
        error: null 
      };
    } else {
      return { data: null, error: new Error('Document not found') };
    }
  } catch (error) {
    console.error(`Error getting document ${docId} from ${collectionName}:`, error);
    
    // If we're offline and caching is enabled, try to get from cache
    if (useCache && isOffline()) {
      try {
        const cacheKey = `${collectionName}_${docId}`;
        const cachedData = getFromCache(cacheKey);
        if (cachedData) {
          console.log('Serving from cache:', cacheKey);
          return { data: cachedData, error: null };
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
    }
    
    return { data: null, error };
  }
};

/**
 * Safe real-time listener with error handling and automatic reconnection
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options (same as safeQuery)
 * @param {Function} onUpdate - Callback for data updates
 * @param {Function} onError - Callback for errors
 * @returns {Function} - Unsubscribe function
 */
export const setupListener = (collectionName, options, onUpdate, onError) => {
  try {
    let q = collection(db, collectionName);
    
    // Apply where clause if provided
    if (options?.whereField && options?.whereValue !== undefined) {
      q = query(q, where(options.whereField, options.whereOp || '==', options.whereValue));
    }
    
    // Apply ordering if specified
    if (options?.orderByField) {
      q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'));
    }
    
    // Apply limit if specified
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }
    
    // Setup the snapshot listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const data = [];
          querySnapshot.forEach((doc) => {
            data.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Cache the data for offline use
          if (options?.useCache !== false) {
            const cacheKey = `${collectionName}_${JSON.stringify(options || {})}`;
            saveToCache(cacheKey, data);
          }
          
          onUpdate(data);
        } catch (error) {
          console.error('Error processing snapshot:', error);
          if (onError) onError(error);
        }
      },
      (error) => {
        console.error('Listener error:', error);
        if (onError) onError(error);
        
        // Try to reconnect if we're still online
        if (getConnectionStatus() === 'online') {
          console.log('Attempting to reconnect...');
          setTimeout(() => {
            setupListener(collectionName, options, onUpdate, onError);
          }, 5000); // Retry after 5 seconds
        }
      }
    );
    
    // Return cleanup function
    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing:', e);
      }
    };
  } catch (error) {
    console.error('Error setting up listener:', error);
    if (onError) onError(error);
    
    // Return a no-op function if setup fails
    return () => {};
  }
};

// Cache utility functions
const saveToCache = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(`firestore_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(`firestore_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = new Date().getTime();
    
    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(`firestore_${key}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

/**
 * Clear all Firestore cache
 */
export const clearFirestoreCache = () => {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('firestore_')) {
        localStorage.removeItem(key);
      }
    }
    console.log('Firestore cache cleared');
  } catch (error) {
    console.error('Error clearing Firestore cache:', error);
  }
};

/**
 * Check if we're currently offline
 * @returns {boolean} - True if offline
 */
export const isOffline = () => {
  return getConnectionStatus() === 'offline';
};

// Set up network status listeners
const setupNetworkListeners = (onStatusChange) => {
  if (typeof window !== 'undefined') {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      onStatusChange(isOnline ? 'online' : 'offline');
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Initial status
    updateStatus();
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }
};

// Initialize network listeners
setupNetworkListeners(setConnectionStatus);
