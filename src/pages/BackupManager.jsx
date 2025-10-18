import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Download, 
  Upload, 
  Database,
  FileDown,
  FileUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Calendar,
  HardDrive,
  Cloud,
  FileText,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const BackupManager = () => {
  const { userRole } = useAuth();
  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [stats, setStats] = useState({
    members: 0,
    attendance: 0,
    contributions: 0,
    visitors: 0
  });

  const collections = [
    { id: 'all', name: 'All Data', icon: Database },
    { id: 'members', name: 'Members', icon: FileText },
    { id: 'attendance_sessions', name: 'Attendance Sessions', icon: Calendar },
    { id: 'attendance_records', name: 'Attendance Records', icon: CheckCircle },
    { id: 'contributions', name: 'Contributions', icon: FileDown },
    { id: 'visitors', name: 'Visitors', icon: FileUp },
    { id: 'special_occasions', name: 'Special Occasions', icon: Calendar },
    { id: 'achievements', name: 'Achievements', icon: CheckCircle }
  ];

  useEffect(() => {
    if (userRole === 'admin') {
      fetchStats();
      fetchBackupHistory();
    }
  }, [userRole]);

  const fetchStats = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const attendanceSnapshot = await getDocs(collection(db, 'attendance_records'));
      const contributionsSnapshot = await getDocs(collection(db, 'contributions'));
      const visitorsSnapshot = await getDocs(collection(db, 'visitors'));

      setStats({
        members: membersSnapshot.size,
        attendance: attendanceSnapshot.size,
        contributions: contributionsSnapshot.size,
        visitors: visitorsSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBackupHistory = async () => {
    try {
      const backupsSnapshot = await getDocs(collection(db, 'backups'));
      const backups = backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setBackupHistory(backups);
    } catch (error) {
      console.error('Error fetching backup history:', error);
    }
  };

  const exportToJSON = async (collectionName) => {
    setLoading(true);
    try {
      let data = {};
      
      if (collectionName === 'all') {
        // Export all collections
        for (const col of collections.filter(c => c.id !== 'all')) {
          const snapshot = await getDocs(collection(db, col.id));
          data[col.id] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      } else {
        // Export single collection
        const snapshot = await getDocs(collection(db, collectionName));
        data[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Create JSON file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${collectionName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save backup record
      await addDoc(collection(db, 'backups'), {
        type: 'export',
        format: 'json',
        collection: collectionName,
        recordCount: collectionName === 'all' 
          ? Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
          : data[collectionName].length,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });

      toast.success('Data exported successfully');
      fetchBackupHistory();
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (collectionName) => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (data.length === 0) {
        toast.error('No data to export');
        setLoading(false);
        return;
      }

      // Get all unique keys
      const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))];
      
      // Create CSV header
      const csvHeader = keys.join(',');
      
      // Create CSV rows
      const csvRows = data.map(row => 
        keys.map(key => {
          const value = row[key];
          // Handle special characters and quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );

      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${collectionName}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save backup record
      await addDoc(collection(db, 'backups'), {
        type: 'export',
        format: 'csv',
        collection: collectionName,
        recordCount: data.length,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });

      toast.success('Data exported to CSV successfully');
      fetchBackupHistory();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export to CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setLoading(true);
    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);

      let importCount = 0;
      
      // Handle different import formats
      if (typeof data === 'object' && !Array.isArray(data)) {
        // Multi-collection import
        for (const [collectionName, records] of Object.entries(data)) {
          if (Array.isArray(records)) {
            for (const record of records) {
              const { id, ...recordData } = record;
              if (id) {
                await setDoc(doc(db, collectionName, id), recordData);
              } else {
                await addDoc(collection(db, collectionName), recordData);
              }
              importCount++;
            }
          }
        }
      } else if (Array.isArray(data)) {
        // Single collection import
        for (const record of data) {
          const { id, ...recordData } = record;
          if (id && selectedCollection !== 'all') {
            await setDoc(doc(db, selectedCollection, id), recordData);
          } else if (selectedCollection !== 'all') {
            await addDoc(collection(db, selectedCollection), recordData);
          }
          importCount++;
        }
      }

      // Save import record
      await addDoc(collection(db, 'backups'), {
        type: 'import',
        format: 'json',
        collection: selectedCollection,
        recordCount: importCount,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });

      toast.success(`Successfully imported ${importCount} records`);
      setImportFile(null);
      fetchStats();
      fetchBackupHistory();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data. Please check file format.');
    } finally {
      setLoading(false);
    }
  };

  const deleteBackupRecord = async (backupId) => {
    if (!window.confirm('Delete this backup record?')) return;

    try {
      await deleteDoc(doc(db, 'backups', backupId));
      toast.success('Backup record deleted');
      fetchBackupHistory();
    } catch (error) {
      console.error('Error deleting backup record:', error);
      toast.error('Failed to delete backup record');
    }
  };

  const createManualBackup = async () => {
    setLoading(true);
    try {
      // Export all data
      await exportToJSON('all');
      toast.success('Manual backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can access backup management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔒 Backup & Data Management</h1>
            <p className="opacity-90">Export, import, and manage your church data</p>
          </div>
          <div className="hidden md:block">
            <Database className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Members</p>
              <p className="text-3xl font-bold text-blue-900">{stats.members}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Attendance</p>
              <p className="text-3xl font-bold text-green-900">{stats.attendance}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Contributions</p>
              <p className="text-3xl font-bold text-purple-900">{stats.contributions}</p>
            </div>
            <FileDown className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Visitors</p>
              <p className="text-3xl font-bold text-orange-900">{stats.visitors}</p>
            </div>
            <FileUp className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
              <p className="text-sm text-gray-600">Download data for backup or archiving</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Select Collection</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="input-field"
              >
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => exportToJSON(selectedCollection)}
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <FileDown className="w-5 h-5" />
                <span>Export JSON</span>
              </button>
              
              {selectedCollection !== 'all' && (
                <button
                  onClick={() => exportToCSV(selectedCollection)}
                  disabled={loading}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            <button
              onClick={createManualBackup}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Create Full Backup</span>
            </button>
          </div>
        </div>

        {/* Import Data */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Data</h2>
              <p className="text-sm text-gray-600">Restore data from backup file</p>
            </div>
          </div>

          <form onSubmit={handleImport} className="space-y-3">
            <div>
              <label className="label">Target Collection</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="input-field"
              >
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Select JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="input-field"
              />
            </div>

            {importFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>File:</strong> {importFile.name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Size:</strong> {(importFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Importing data will add or update records. 
                  Existing records with the same ID will be overwritten.
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !importFile}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Import Data</span>
            </button>
          </form>
        </div>
      </div>

      {/* Backup History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Clock className="w-6 h-6 text-gray-600" />
            <span>Backup History</span>
          </h2>
          <button
            onClick={fetchBackupHistory}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {backupHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <HardDrive className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No backup history yet</p>
            <p className="text-sm">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Format</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Collection</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Records</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map((backup) => (
                  <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        backup.type === 'export' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.type === 'export' ? (
                          <span className="flex items-center space-x-1">
                            <Download className="w-3 h-3" />
                            <span>Export</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <Upload className="w-3 h-3" />
                            <span>Import</span>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 uppercase">{backup.format}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{backup.collection}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{backup.recordCount}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(backup.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        backup.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteBackupRecord(backup.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google Sheets Integration Info */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <div className="flex items-start space-x-3">
          <Cloud className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Google Sheets Integration</h3>
            <p className="text-sm text-gray-700 mb-3">
              For automated backups to Google Sheets, you'll need to set up Google Sheets API credentials 
              and configure the integration in your Firebase project.
            </p>
            <div className="bg-white rounded-lg p-3 text-sm text-gray-600">
              <p className="font-semibold mb-1">Setup Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enable Google Sheets API in Google Cloud Console</li>
                <li>Create service account credentials</li>
                <li>Share your Google Sheet with the service account email</li>
                <li>Configure credentials in Firebase Functions</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
