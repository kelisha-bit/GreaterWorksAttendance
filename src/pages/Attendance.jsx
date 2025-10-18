import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  X, 
  Calendar, 
  Users, 
  CheckCircle,
  Camera,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { format } from 'date-fns';

const Attendance = () => {
  const { isLeader } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    eventType: 'Sunday Service',
    department: 'All'
  });

  const eventTypes = [
    'Sunday Service',
    'Prayer Meeting',
    'Bible Study',
    'Department Meeting',
    'Youth Service',
    'Children Service',
    'Special Event',
    'Other'
  ];

  const departments = [
    'All',
    'Choir',
    'Ushering',
    'Media',
    'Children Ministry',
    'Youth Ministry',
    'Prayer Team',
    'Welfare',
    'Protocol',
    'Other'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords(selectedSession.id);
    }
  }, [selectedSession]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch sessions
      const sessionsQuery = query(
        collection(db, 'attendance_sessions'),
        orderBy('date', 'desc')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsList = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsList);

      // Fetch members
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async (sessionId) => {
    try {
      const q = query(
        collection(db, 'attendance_records'),
        where('sessionId', '==', sessionId)
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const sessionData = {
        name: formData.name,
        date: formData.date,
        eventType: formData.eventType,
        department: formData.department,
        attendeeCount: 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'attendance_sessions'), sessionData);
      toast.success('Session created successfully');
      fetchData();
      setShowCreateModal(false);
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        eventType: 'Sunday Service',
        department: 'All'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const markAttendance = async (memberId) => {
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    try {
      // Check if already marked
      const existing = attendanceRecords.find(r => r.memberId === memberId);
      if (existing) {
        toast.error('Member already marked present');
        return;
      }

      // Add attendance record
      await addDoc(collection(db, 'attendance_records'), {
        sessionId: selectedSession.id,
        memberId: memberId,
        markedAt: new Date().toISOString()
      });

      // Update session attendee count
      const sessionRef = doc(db, 'attendance_sessions', selectedSession.id);
      await updateDoc(sessionRef, {
        attendeeCount: (selectedSession.attendeeCount || 0) + 1
      });

      toast.success('Attendance marked successfully');
      fetchAttendanceRecords(selectedSession.id);
      
      // Update local session data
      const updatedSession = { ...selectedSession, attendeeCount: (selectedSession.attendeeCount || 0) + 1 };
      setSelectedSession(updatedSession);
      setSessions(sessions.map(s => s.id === selectedSession.id ? updatedSession : s));
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
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
          const member = members.find(m => m.memberId === decodedText);
          if (member) {
            markAttendance(member.id);
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

  const getFilteredMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment && filterDepartment !== 'All') {
      filtered = filtered.filter(m => m.department === filterDepartment);
    }

    return filtered;
  };

  const isPresent = (memberId) => {
    return attendanceRecords.some(r => r.memberId === memberId);
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
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setSelectedSession(session);
                  setShowMarkModal(true);
                }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedSession?.id === session.id
                    ? 'border-church-gold bg-church-lightGold'
                    : 'border-gray-200 hover:border-church-gold'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{session.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(session.date), 'MMM dd, yyyy')}
                  </p>
                  <p className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {session.attendeeCount || 0} attendees
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
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSession.name}</h2>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedSession.date), 'MMMM dd, yyyy')} • {selectedSession.attendeeCount || 0} present
                </p>
              </div>
              <button onClick={() => setShowMarkModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
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
                {getFilteredMembers().map((member) => {
                  const present = isPresent(member.id);
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                        present
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.fullName}</p>
                        <p className="text-sm text-gray-600">
                          {member.department} • {member.membershipType}
                        </p>
                      </div>
                      {isLeader && (
                        <button
                          onClick={() => markAttendance(member.id)}
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
    </div>
  );
};

export default Attendance;
