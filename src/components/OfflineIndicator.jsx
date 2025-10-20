import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle } from 'lucide-react';
import { offlineSyncManager } from '../utils/offlineSync';
import { offlineStorage } from '../utils/offlineStorage';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to sync events
    const unsubscribe = offlineSyncManager.addListener((event) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'syncStart':
          setIsSyncing(true);
          break;
        case 'syncComplete':
          setIsSyncing(false);
          updatePendingCount();
          break;
        case 'recordSavedOffline':
          updatePendingCount();
          break;
      }
    });

    // Initial pending count
    updatePendingCount();

    // Update pending count every 30 seconds
    const interval = setInterval(updatePendingCount, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await offlineStorage.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      return;
    }
    setIsSyncing(true);
    await offlineSyncManager.manualSync();
    setIsSyncing(false);
  };

  // Don't show indicator if online and no pending records
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Main indicator button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
          isOnline 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
        title={isOnline ? 'Online' : 'Offline'}
      >
        {isOnline ? (
          <Wifi className="w-5 h-5" />
        ) : (
          <WifiOff className="w-5 h-5 animate-pulse" />
        )}
        
        {pendingCount > 0 && (
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span className="text-sm font-semibold">{pendingCount}</span>
          </div>
        )}
        
        {isSyncing && (
          <RefreshCw className="w-4 h-4 animate-spin" />
        )}
      </button>

      {/* Details panel */}
      {showDetails && (
        <div className="fixed bottom-20 right-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Connection Status</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">Online</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">Offline</span>
                </>
              )}
            </div>

            {/* Pending records */}
            {pendingCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      {pendingCount} record{pendingCount !== 1 ? 's' : ''} pending sync
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {isOnline 
                        ? 'Will sync automatically' 
                        : 'Will sync when connection is restored'}
                    </p>
                  </div>
                </div>

                {/* Manual sync button */}
                {isOnline && !isSyncing && (
                  <button
                    onClick={handleManualSync}
                    className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync Now</span>
                  </button>
                )}

                {isSyncing && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Syncing...</span>
                  </div>
                )}
              </div>
            )}

            {/* Success message */}
            {isOnline && pendingCount === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-900">All records synced</p>
                </div>
              </div>
            )}

            {/* Offline mode info */}
            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Offline Mode:</strong> Attendance records will be saved locally 
                  and automatically synced when your connection is restored.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
