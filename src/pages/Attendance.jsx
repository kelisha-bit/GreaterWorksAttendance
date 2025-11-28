import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  X, 
  Calendar, 
  Users, 
  CheckCircle,
  Camera,
  Search,
  Filter,
  Download,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  useAttendanceSessions, 
  useAttendanceRecords, 
  useMembers, 
  useAttendanceFilters,
  useAllAttendanceRecords
} from '../hooks/useAttendanceData';

const Attendance = () => {
  const { isLeader } = useAuth();
  
  // Custom hooks for data management
  const { sessions, loading: sessionsLoading, createSession, deleteSession } = useAttendanceSessions();
  const { members, loading: membersLoading, getMemberById } = useMembers();
  const { getAttendanceCountForSession } = useAllAttendanceRecords();
  
  // State management
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const scannerRef = useRef(null);
  
  // Attendance records for selected session
  const { records: attendanceRecords, loading: recordsLoading, markAttendance } = useAttendanceRecords(selectedSession?.id);
  
  // Filters
  const {
    searchTerm,
    setSearchTerm,
    filterDepartment,
    setFilterDepartment,
    departments,
    getFilteredMembers,
    isPresent,
    getPresentMembers
  } = useAttendanceFilters(members, attendanceRecords);
  
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    eventType: 'Sunday Service',
    department: 'All'
  });

  const loading = sessionsLoading || membersLoading;

  const eventTypes = [
    'Sunday Service',
    'Prayer Meeting',
    'Bible Study',
    'Department Meeting',
    'Youth Service',
    'Children Service',
    'Special Event',
    'Wednesday Prayer Service',
    'Annual Harvest and Thanksgiving Service',
    'New Year Service',
    'Crossover Service',
    'Thanksgiving Service',
    'Others',
    
  ];


  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);


  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createSession(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        eventType: 'Sunday Service',
        department: 'All'
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };


  const initQRScanner = () => {
    setShowQRScanner(true);
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        qrbox: { width: 250, height: 250 },
        fps: 10
      });

      scanner.render(
        (decodedText) => {
          // Find member by ID
          const member = getMemberById(decodedText);
          if (member) {
            markAttendance(member.memberId);
            scanner.clear();
            setShowQRScanner(false);
          } else {
            toast.error('Member not found');
          }
        },
        (error) => {
          // Ignore scanning errors
        }
      );

      scannerRef.current = scanner;
    }, 100);
  };

  const closeQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setShowQRScanner(false);
  };


  const exportSessionToPDF = () => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Greater Works Attendance Report', 14, 20);
    
    // Session Info
    doc.setFontSize(12);
    doc.text(`Session: ${selectedSession.name}`, 14, 30);
    doc.text(`Date: ${format(new Date(selectedSession.date), 'MMMM dd, yyyy')}`, 14, 37);
    doc.text(`Event Type: ${selectedSession.eventType}`, 14, 44);
    doc.text(`Department: ${selectedSession.department}`, 14, 51);
    doc.text(`Total Attendees: ${attendanceRecords.length || 0}`, 14, 58);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 65);
    
    // Get present members
    const presentMembers = getPresentMembers();
    
    // Attendance table
    const tableData = presentMembers.map((member, index) => [
      index + 1,
      member.memberId,
      member.fullName,
      Array.isArray(member.department) ? member.department.join(', ') : member.department,
      member.phoneNumber,
      'Present'
    ]);
    
    doc.autoTable({
      startY: 75,
      head: [['#', 'Member ID', 'Full Name', 'Department', 'Phone', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
      styles: { fontSize: 9 }
    });
    
    doc.save(`attendance-${selectedSession.name}-${format(new Date(selectedSession.date), 'yyyy-MM-dd')}.pdf`);
    toast.success('Attendance report exported successfully');
  };

  const exportSessionToCSV = () => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    const presentMembers = getPresentMembers();
    
    const headers = ['Member ID', 'Full Name', 'Department', 'Phone Number', 'Email', 'Membership Type', 'Status'];
    const rows = presentMembers.map(member => [
      member.memberId,
      member.fullName,
      Array.isArray(member.department) ? member.department.join(', ') : member.department,
      member.phoneNumber,
      member.email || 'N/A',
      member.membershipType,
      'Present'
    ]);
    
    const csvContent = [
      `Session: ${selectedSession.name}`,
      `Date: ${selectedSession.date}`,
      `Event Type: ${selectedSession.eventType}`,
      `Total Attendees: ${attendanceRecords.length || 0}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedSession.name}-${format(new Date(selectedSession.date), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast.success('Attendance report exported successfully');
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSession(sessionToDelete.id);
      
      // Clear selected session if it was deleted
      if (selectedSession?.id === sessionToDelete.id) {
        setSelectedSession(null);
        setShowMarkModal(false);
      }
      
      // Close modals
      setShowDeleteModal(false);
      setSessionToDelete(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const confirmDeleteSession = (session, e) => {
    e.stopPropagation(); // Prevent opening the mark modal
    setSessionToDelete(session);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
        {isLeader && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Session</span>
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Sessions</h2>
        
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No sessions created yet</p>
            {isLeader && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-church-gold hover:text-church-darkGold mt-2"
              >
                Create your first session
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                onClick={() => {
                  setSelectedSession(session);
                  setShowMarkModal(true);
                }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative animate-grid-item ${
                  index < 20 ? `stagger-${index + 1}` : 'stagger-max'
                } ${
                  selectedSession?.id === session.id
                    ? 'border-church-gold bg-church-lightGold'
                    : 'border-gray-200 hover:border-church-gold'
                }`}
              >
                {isLeader && (
                  <button
                    onClick={(e) => confirmDeleteSession(session, e)}
                    className="absolute top-2 right-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <h3 className="font-semibold text-gray-900 mb-2 pr-8">{session.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(session.date), 'MMM dd, yyyy')}
                  </p>
                  <p className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {getAttendanceCountForSession(session.id)} attendees
                  </p>
                  <p className="text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                    {session.eventType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create Attendance Session</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="label">Session Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Sunday Service - Oct 20, 2025"
                  required
                />
              </div>

              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Event Type *</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="input-field"
                  required
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input-field"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showMarkModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSession.name}</h2>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedSession.date), 'MMMM dd, yyyy')} • {attendanceRecords.length || 0} present
                  </p>
                </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <button onClick={() => setShowMarkModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportSessionToCSV}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={exportSessionToPDF}
                  className="btn-primary flex items-center space-x-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* QR Scanner Button */}
              {isLeader && (
                <div className="flex justify-center">
                  <button
                    onClick={initQRScanner}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Scan QR Code</span>
                  </button>
                </div>
              )}

              {/* QR Scanner */}
              {showQRScanner && (
                <div className="border-2 border-church-gold rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Scan Member QR Code</h3>
                    <button onClick={closeQRScanner} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div id="qr-reader"></div>
                </div>
              )}

              {/* Search and Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="input-field pl-10"
                  >
                    <option value="">All Departments</option>
                    {departments.filter(d => d !== 'All').map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                {getFilteredMembers().map((member, index) => {
                  const present = isPresent(member);
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 animate-fade-in-up ${
                        index < 20 ? `stagger-${index + 1}` : 'stagger-max'
                      } ${
                        present
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {member.fullName} <span className="text-church-gold font-semibold">({member.memberId})</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {Array.isArray(member.department) ? member.department.join(', ') : member.department} • {member.membershipType}
                        </p>
                      </div>
                      {isLeader && (
                        <button
                          onClick={() => markAttendance(member.memberId)}
                          disabled={present}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            present
                              ? 'bg-green-500 text-white cursor-not-allowed'
                              : 'bg-church-gold hover:bg-church-darkGold text-white'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{present ? 'Present' : 'Mark'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Session</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to delete this session and all associated records?
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-semibold text-gray-900">{sessionToDelete.name}</p>
                    <p className="text-gray-600">
                      {format(new Date(sessionToDelete.date), 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-gray-600">
                      {getAttendanceCountForSession(sessionToDelete.id)} attendance record(s)
                    </p>
                  </div>
                  <p className="text-sm text-red-600 mt-3">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
