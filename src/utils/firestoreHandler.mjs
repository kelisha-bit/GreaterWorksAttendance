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
const setConnectionStatus = (status) => {
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
const getConnectionStatus = () => connectionStatus;

/**
 * Add connection status listener
 * @param {Function} listener - Function to call when connection status changes
 * @returns {Function} - Function to remove listener
 */
const addConnectionListener = (listener) => {
  connectionListeners.push(listener);
  // Immediately call with current status
  listener(connectionStatus);
  
  // Return cleanup function
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
}

/**
 * Safe query with error handling and offline support
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options
 * @param {Array} options.whereConditions - Array of where conditions [field, operator, value]
 * @param {Array} options.orderByFields - Array of orderBy fields [field, direction]
 * @param {number} options.limitCount - Number of documents to limit
 * @param {Object} options.startAfterDoc - Document to start after for pagination
 * @param {Object} options.endBeforeDoc - Document to end before for pagination
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @returns {Promise<Array>} - Array of documents
 */
const safeQuery = async (collectionName, options = {}) => {
  const {
    whereConditions = [],
    orderByFields = [],
    limitCount = null,
    startAfterDoc = null,
    endBeforeDoc = null,
    useCache = true
  } = options;

  const cacheKey = `firestore_${collectionName}_${JSON.stringify(options)}`;
  
  // Try to get from cache first if useCache is true
  if (useCache) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${collectionName}`);
      return cachedData;
    }
  }

  try {
    // Build the query
    let q = collection(db, collectionName);
    
    // Add query constraints
    const constraints = [];
    
    // Add where conditions
    whereConditions.forEach(condition => {
      if (condition.length === 3) {
        constraints.push(where(condition[0], condition[1], condition[2]));
      }
    });
    
    // Add orderBy fields
    orderByFields.forEach(field => {
      if (Array.isArray(field) && field.length === 2) {
        constraints.push(orderBy(field[0], field[1]));
      } else if (typeof field === 'string') {
        constraints.push(orderBy(field));
      }
    });
    
    // Add limit if provided
    if (limitCount) {
      constraints.push(limit(limitCount));
    }
    
    // Add startAfter if provided
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    
    // Add endBefore if provided
    if (endBeforeDoc) {
      constraints.push(endBefore(endBeforeDoc));
    }
    
    // Apply constraints
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    } else {
      q = query(q);
    }
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Cache the results
    saveToCache(cacheKey, results);
    
    return results;
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Safe document retrieval with error handling and offline support
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<Object|null>} - Document data or null if not found
 */
const safeGetDoc = async (collectionName, docId, useCache = true) => {
  const cacheKey = `firestore_${collectionName}_${docId}`;
  
  // Try to get from cache first if useCache is true
  if (useCache) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${collectionName}/${docId}`);
      return cachedData;
    }
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      // Cache the result
      saveToCache(cacheKey, data);
      return data;
    } else {
      console.log(`No such document: ${collectionName}/${docId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Safe real-time listener with error handling and automatic reconnection
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options
 * @param {Array} options.whereConditions - Array of where conditions [field, operator, value]
 * @param {Array} options.orderByFields - Array of orderBy fields [field, direction]
 * @param {number} options.limitCount - Number of documents to limit
 * @param {Function} onUpdate - Callback function for updates
 * @param {Function} onError - Optional error callback
 * @returns {Function} - Unsubscribe function
 */
const setupListener = (collectionName, options = {}, onUpdate, onError) => {
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds
  let unsubscribe = null;
  let retryTimeout = null;
  
  const setupListenerInternal = () => {
    const {
      whereConditions = [],
      orderByFields = [],
      limitCount = null,
      startAfterDoc = null,
      endBeforeDoc = null
    } = options;
    
    const cacheKey = `firestore_${collectionName}_${JSON.stringify(options)}`;
    
    try {
      // Build the query
      let q = collection(db, collectionName);
      
      // Add query constraints
      const constraints = [];
      
      // Add where conditions
      whereConditions.forEach(condition => {
        if (condition.length === 3) {
          constraints.push(where(condition[0], condition[1], condition[2]));
        }
      });
      
      // Add orderBy fields
      orderByFields.forEach(field => {
        if (Array.isArray(field) && field.length === 2) {
          constraints.push(orderBy(field[0], field[1]));
        } else if (typeof field === 'string') {
          constraints.push(orderBy(field));
        }
      });
      
      // Add limit if provided
      if (limitCount) {
        constraints.push(limit(limitCount));
      }
      
      // Add startAfter if provided
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }
      
      // Add endBefore if provided
      if (endBeforeDoc) {
        constraints.push(endBefore(endBeforeDoc));
      }
      
      // Apply constraints
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      } else {
        q = query(q);
      }
      
      // Set up the listener with error handling
      return onSnapshot(
        q,
        (querySnapshot) => {
          // Reset retry count on successful connection
          retryCount = 0;
          
          const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Cache the results
          saveToCache(cacheKey, results);
          
          // Call the update callback
          if (onUpdate) {
            onUpdate(results);
          }
        },
        (error) => {
          console.error(`Error in snapshot listener for ${collectionName}:`, error);
          
          // Handle specific error types
          if (error.code === 'failed-precondition') {
            console.error('This query requires an index. Please create it in the Firebase console.');
            if (onError) onError(error);
          } else if (error.code === 'unavailable' || error.message?.includes('ERR_ABORTED')) {
            console.error('The service is currently unavailable. Please check your connection.');
            
            // Try to get from cache as fallback
            const cachedData = getFromCache(cacheKey);
            if (cachedData && onUpdate) {
              console.log(`Using cached data as fallback for ${collectionName} listener`);
              onUpdate(cachedData);
            }
            
            // Attempt to reconnect if under max retries
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Attempting to reconnect (${retryCount}/${maxRetries}) in ${retryDelay/1000}s...`);
              
              // Clear any existing retry timeout
              if (retryTimeout) {
                clearTimeout(retryTimeout);
              }
              
              // Set up retry
              retryTimeout = setTimeout(() => {
                console.log(`Retrying connection to ${collectionName}...`);
                if (unsubscribe) {
                  unsubscribe();
                }
                unsubscribe = setupListenerInternal();
              }, retryDelay);
            } else {
              console.error(`Max retries (${maxRetries}) reached for ${collectionName} listener`);
              if (onError) onError(error);
            }
            setConnectionStatus('offline');
          } else if (onError) {
            onError(error);
          }
        }
      );
    } catch (error) {
      console.error(`Error setting up snapshot listener for ${collectionName}:`, error);
      
      // Try to get from cache as fallback
      const cachedData = getFromCache(cacheKey);
      if (cachedData && onUpdate) {
        console.log(`Using cached data as fallback for ${collectionName} listener setup`);
        onUpdate(cachedData);
      }
      
      // Call the onError callback if provided
      if (onError) {
        onError(error);
      }
      
      // Return a no-op function if setup fails
      return () => {};
    }
  };
  
  // Initialize the listener
  unsubscribe = setupListenerInternal();
  
  // Return the unsubscribe function
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  };
};

// Cache utility functions
const saveToCache = (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

const getFromCache = (key) => {
  try {
    const cacheItem = localStorage.getItem(key);
    if (!cacheItem) return null;
    
    const { data, timestamp } = JSON.parse(cacheItem);
    
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
};

/**
 * Clear all Firestore cache
 */
const clearFirestoreCache = () => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('firestore_')) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} Firestore cache items`);
  } catch (error) {
    console.error('Error clearing Firestore cache:', error);
  }
};

/**
 * Check if we're currently offline
 * @returns {boolean} - True if offline
 */
const isOffline = () => {
  return !navigator.onLine;
};

// Set up network status listeners
const setupNetworkListeners = (onStatusChange) => {
  const handleStatusChange = () => {
    const status = getConnectionStatus();
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
  }

  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    }
  };
};

// Export all functions
export {
  setConnectionStatus,
  getConnectionStatus,
  addConnectionListener,
  safeQuery,
  safeGetDoc,
  setupListener,
  saveToCache,
  getFromCache,
  clearFirestoreCache,
  isOffline,
  setupNetworkListeners
};