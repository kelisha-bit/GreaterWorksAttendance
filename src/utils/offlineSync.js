// Offline Sync Manager
// Handles synchronization of offline attendance records with Firebase

import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { offlineStorage } from './offlineStorage';
import toast from 'react-hot-toast';

class OfflineSyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }
  }

  // Handle online event
  handleOnline() {
    console.log('Connection restored - going online');
    this.isOnline = true;
    this.notifyListeners({ type: 'online' });
    
    // Trigger sync after a short delay
    setTimeout(() => {
      this.syncPendingRecords();
    }, 1000);
  }

  // Handle offline event
  handleOffline() {
    console.log('Connection lost - going offline');
    this.isOnline = false;
    this.notifyListeners({ type: 'offline' });
    toast.error('You are offline. Attendance will be saved locally and synced when online.', {
      duration: 5000
    });
  }

  // Handle messages from service worker
  handleServiceWorkerMessage(event) {
    const { data } = event;
    
    switch (data.type) {
      case 'SYNC_START':
        console.log('Background sync started:', data.count, 'records');
        this.notifyListeners({ type: 'syncStart', count: data.count });
        break;
        
      case 'SYNC_COMPLETE':
        console.log('Background sync completed:', data.success, 'success,', data.failed, 'failed');
        this.notifyListeners({ 
          type: 'syncComplete', 
          success: data.success, 
          failed: data.failed 
        });
        
        if (data.success > 0) {
          toast.success(`Synced ${data.success} attendance record(s)`);
        }
        if (data.failed > 0) {
          toast.error(`Failed to sync ${data.failed} record(s)`);
        }
        break;
        
      case 'SYNC_RECORD':
        // Service worker is asking us to sync a specific record
        this.syncSingleRecord(data.record, event.ports[0]);
        break;
    }
  }

  // Add sync listener
  addListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // Check if online
  checkOnlineStatus() {
    return this.isOnline && navigator.onLine;
  }

  // Save attendance record (online or offline)
  async saveAttendanceRecord(sessionId, memberId, memberData) {
    const record = {
      sessionId,
      memberId,
      memberName: memberData.fullName,
      memberDepartment: memberData.department,
      markedAt: new Date().toISOString()
    };

    if (this.checkOnlineStatus()) {
      // Online - save directly to Firebase
      try {
        await this.syncToFirebase(record);
        toast.success('Attendance marked successfully');
        return { success: true, online: true };
      } catch (error) {
        console.error('Failed to save online, falling back to offline:', error);
        // Fall back to offline storage
        await offlineStorage.saveAttendanceRecord(record);
        toast.success('Attendance saved offline. Will sync when online.');
        this.notifyListeners({ type: 'recordSavedOffline', record });
        return { success: true, online: false };
      }
    } else {
      // Offline - save to IndexedDB
      await offlineStorage.saveAttendanceRecord(record);
      toast.success('Attendance saved offline. Will sync when online.', {
        icon: '📴',
        duration: 4000
      });
      this.notifyListeners({ type: 'recordSavedOffline', record });
      return { success: true, online: false };
    }
  }

  // Sync a single record to Firebase
  async syncToFirebase(record) {
    // Add attendance record
    await addDoc(collection(db, 'attendance_records'), {
      sessionId: record.sessionId,
      memberId: record.memberId,
      markedAt: record.markedAt
    });

    // Update session attendee count
    const sessionRef = doc(db, 'attendance_sessions', record.sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      const currentCount = sessionDoc.data().attendeeCount || 0;
      await updateDoc(sessionRef, {
        attendeeCount: currentCount + 1
      });
    }
  }

  // Sync a single record (called by service worker)
  async syncSingleRecord(record, port) {
    try {
      await this.syncToFirebase(record);
      
      // Notify service worker of success
      if (port) {
        port.postMessage({ success: true });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to sync record:', error);
      
      // Notify service worker of failure
      if (port) {
        port.postMessage({ success: false, error: error.message });
      }
      
      return false;
    }
  }

  // Sync all pending records
  async syncPendingRecords() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.checkOnlineStatus()) {
      console.log('Cannot sync - offline');
      return;
    }

    try {
      this.isSyncing = true;
      const pendingRecords = await offlineStorage.getPendingRecords();
      
      if (pendingRecords.length === 0) {
        console.log('No pending records to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`Syncing ${pendingRecords.length} pending records...`);
      this.notifyListeners({ type: 'syncStart', count: pendingRecords.length });

      let successCount = 0;
      let failCount = 0;

      for (const record of pendingRecords) {
        try {
          await this.syncToFirebase(record);
          await offlineStorage.deleteRecord(record.id);
          successCount++;
        } catch (error) {
          console.error('Failed to sync record:', error);
          failCount++;
        }
      }

      this.notifyListeners({ 
        type: 'syncComplete', 
        success: successCount, 
        failed: failCount 
      });

      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} attendance record(s)`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} record(s). Will retry later.`);
      }

      console.log(`Sync complete: ${successCount} success, ${failCount} failed`);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync attendance records');
      this.notifyListeners({ type: 'syncError', error });
    } finally {
      this.isSyncing = false;
    }
  }

  // Request background sync (if supported)
  async requestBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-attendance');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Failed to register background sync:', error);
        // Fallback to manual sync
        this.syncPendingRecords();
      }
    } else {
      console.log('Background sync not supported, using manual sync');
      this.syncPendingRecords();
    }
  }

  // Get pending count
  async getPendingCount() {
    return await offlineStorage.getPendingCount();
  }

  // Manual sync trigger
  async manualSync() {
    if (!this.checkOnlineStatus()) {
      toast.error('Cannot sync while offline');
      return;
    }

    toast.loading('Syncing attendance records...');
    await this.syncPendingRecords();
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager();
export default offlineSyncManager;
