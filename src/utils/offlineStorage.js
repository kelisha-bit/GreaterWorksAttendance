// IndexedDB wrapper for offline data storage
// Handles local storage of attendance records when offline

const DB_NAME = 'GreaterWorksOffline';
const DB_VERSION = 1;
const STORE_NAME = 'pendingAttendance';

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for pending attendance records
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for querying
          objectStore.createIndex('sessionId', 'sessionId', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('synced', 'synced', { unique: false });
          
          console.log('Object store created:', STORE_NAME);
        }
      };
    });
  }

  // Ensure database is initialized
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // Save attendance record offline
  async saveAttendanceRecord(record) {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const recordWithMetadata = {
        ...record,
        timestamp: new Date().toISOString(),
        synced: 'false' // Use string instead of boolean
      };
      
      const request = store.add(recordWithMetadata);
      
      request.onsuccess = () => {
        console.log('Attendance record saved offline:', request.result);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to save attendance record:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all pending (unsynced) records
  async getPendingRecords() {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll('false');
      
      request.onsuccess = () => {
        console.log('Retrieved pending records:', request.result.length);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to get pending records:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all records for a specific session
  async getRecordsBySession(sessionId) {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Mark a record as synced
  async markAsSynced(recordId) {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(recordId);
      
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = 'true'; // Use string instead of boolean
          record.syncedAt = new Date().toISOString();
          
          const updateRequest = store.put(record);
          
          updateRequest.onsuccess = () => {
            console.log('Record marked as synced:', recordId);
            resolve();
          };
          
          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          reject(new Error('Record not found'));
        }
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  // Delete a record
  async deleteRecord(recordId) {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(recordId);
      
      request.onsuccess = () => {
        console.log('Record deleted:', recordId);
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to delete record:', request.error);
        reject(request.error);
      };
    });
  }

  // Get count of pending records
  async getPendingCount() {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      
      // Use a cursor to count records where synced is 'false'
      const request = index.openCursor(IDBKeyRange.only('false'));
      let count = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          count++;
          cursor.continue();
        } else {
          resolve(count);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear all synced records (cleanup)
  async clearSyncedRecords() {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      // Use IDBKeyRange to query for 'true' values
      const request = index.openCursor(IDBKeyRange.only('true'));
      
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log('Cleared synced records:', deletedCount);
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear all records (for testing/reset)
  async clearAll() {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('All records cleared');
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();
export default offlineStorage;
