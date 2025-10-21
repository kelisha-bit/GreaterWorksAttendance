import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  Clock,
  QrCode,
  DollarSign
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

const MyPortal = () => {
  const { currentUser } = useAuth();
  const [memberProfile, setMemberProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [contributionStats, setContributionStats] = useState({
    total: 0,
    count: 0,
    thisYear: 0
  });
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser?.email) {
      toast.error('No user email found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      // Find member profile by email
      const membersQuery = query(
        collection(db, 'members'),
        where('email', '==', currentUser.email)
      );
      
      const membersSnapshot = await getDocs(membersQuery);
      
      if (membersSnapshot.empty) {
        toast.error('No member profile found. Please contact an administrator.');
        setLoading(false);
        return;
      }

      const memberData = {
        id: membersSnapshot.docs[0].id,
        ...membersSnapshot.docs[0].data()
      };
      
      setMemberProfile(memberData);

      // Fetch attendance data
      await fetchAttendanceData(memberData.memberId);
      await fetchUpcomingSessions();
      await fetchMyContributions(memberData.memberId);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (memberId) => {
    try {
      // Get all attendance sessions
      const sessionsSnapshot = await getDocs(
        query(collection(db, 'attendance_sessions'), orderBy('date', 'desc'))
      );
      const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get all attendance records for this member in a single query
      const attendanceQuery = query(
        collection(db, 'attendance_records'),
        where('memberId', '==', memberId)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
      
      // Create a Set of sessionIds where member was present for O(1) lookup
      const presentSessionIds = new Set(attendanceRecords.map(record => record.sessionId));

      let presentCount = 0;
      let totalSessions = sessions.length;
      const recentRecords = [];

      // Check attendance for each session using the Set
      for (const session of sessions) {
        const wasPresent = presentSessionIds.has(session.id);
        
        if (wasPresent) {
          presentCount++;
        }

        // Add to recent records (last 10)
        if (recentRecords.length < 10) {
          recentRecords.push({
            sessionName: session.name || session.sessionName, // Handle both field names
            date: session.date,
            eventType: session.eventType,
            present: wasPresent
          });
        }
      }

      const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      setAttendanceStats({
        total: totalSessions,
        present: presentCount,
        absent: totalSessions - presentCount,
        percentage
      });

      setRecentAttendance(recentRecords);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessionsQuery = query(
        collection(db, 'attendance_sessions'),
        where('date', '>=', today),
        orderBy('date', 'asc'),
        limit(5)
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setUpcomingSessions(sessions);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  };

  const fetchMyContributions = async (memberId) => {
    try {
      // Simple query without orderBy to avoid needing composite index
      const contributionsQuery = query(
        collection(db, 'contributions'),
        where('memberId', '==', memberId)
      );
      
      const contributionsSnapshot = await getDocs(contributionsQuery);
      let contributions = contributionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date in JavaScript instead
      contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Limit to 10 most recent
      contributions = contributions.slice(0, 10);
      
      setMyContributions(contributions);

      // Calculate stats from all contributions (not just limited 10)
      const allContributions = contributionsSnapshot.docs.map(doc => doc.data());
      const total = allContributions.reduce((sum, c) => sum + c.amount, 0);
      const currentYear = new Date().getFullYear().toString();
      const thisYearTotal = allContributions
        .filter(c => c.date.startsWith(currentYear))
        .reduce((sum, c) => sum + c.amount, 0);

      setContributionStats({
        total,
        count: allContributions.length,
        thisYear: thisYearTotal
      });
    } catch (error) {
      console.error('Error fetching contributions:', error);
      // Don't show error toast if it's just no data - only show for permission errors
      if (error.code === 'permission-denied') {
        toast.error('Unable to load contributions. Please contact administrator.');
      }
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('my-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `My_QR_Code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!memberProfile) {
    return (
      <div className="card text-center py-12">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Found</h2>
        <p className="text-gray-600 mb-4">
          Your account is not linked to a member profile yet.
        </p>
        <p className="text-sm text-gray-500">
          Please contact your church administrator to set up your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card bg-gradient-to-r from-church-gold to-church-darkGold text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            {memberProfile.profilePhotoURL ? (
              <img
                src={memberProfile.profilePhotoURL}
                alt={memberProfile.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">Welcome, {memberProfile.fullName}!</h1>
            <p className="text-white text-opacity-90 mb-3">
              Member ID: <span className="font-mono font-semibold">{memberProfile.memberId}</span>
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                {memberProfile.department}
              </span>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                {memberProfile.membershipType}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowQRModal(true)}
            className="btn-secondary bg-white text-church-gold hover:bg-gray-100 flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>My QR Code</span>
          </button>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Sessions</p>
              <p className="text-3xl font-bold text-blue-900">{attendanceStats.total}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Times Present</p>
              <p className="text-3xl font-bold text-green-900">{attendanceStats.present}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">Times Absent</p>
              <p className="text-3xl font-bold text-red-900">{attendanceStats.absent}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Attendance Rate</p>
              <p className={`text-3xl font-bold ${getAttendanceColor(attendanceStats.percentage)}`}>
                {attendanceStats.percentage}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-church-gold" />
            <span>Personal Information</span>
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-church-gold" />
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="font-semibold text-gray-900">{memberProfile.phoneNumber}</p>
              </div>
            </div>
            
            {memberProfile.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-church-gold" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{memberProfile.email}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-church-gold" />
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-semibold text-gray-900">
                  {Array.isArray(memberProfile.department) 
                    ? memberProfile.department.join(', ') 
                    : memberProfile.department}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Award className="w-5 h-5 text-church-gold" />
              <div>
                <p className="text-xs text-gray-500">Membership Type</p>
                <p className="font-semibold text-gray-900">{memberProfile.membershipType}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-church-gold" />
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="font-semibold text-gray-900">
                  {(() => {
                    const createdAt = memberProfile.createdAt;
                    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-church-gold" />
            <span>Upcoming Sessions</span>
          </h2>
          
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming sessions scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-gradient-to-r from-church-lightGold to-white rounded-lg border border-church-gold border-opacity-20"
                >
                  <p className="font-semibold text-gray-900">{session.name || session.sessionName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-church-gold bg-opacity-20 text-church-darkGold text-xs rounded-full">
                    {session.eventType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Contributions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-church-gold" />
          <span>My Contributions</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-green-600 font-semibold mb-1">Total Contributions</p>
            <p className="text-2xl font-bold text-green-900">
              {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(contributionStats.total)}
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-blue-600 font-semibold mb-1">This Year</p>
            <p className="text-2xl font-bold text-blue-900">
              {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(contributionStats.thisYear)}
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-purple-600 font-semibold mb-1">Total Records</p>
            <p className="text-2xl font-bold text-purple-900">{contributionStats.count}</p>
          </div>
        </div>

        {myContributions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No contribution records found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myContributions.map((contribution) => (
              <div
                key={contribution.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-church-lightGold text-church-darkGold rounded-full text-xs font-semibold">
                      {contribution.contributionType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(contribution.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {contribution.notes && (
                    <p className="text-sm text-gray-600 mt-1">{contribution.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(contribution.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{contribution.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-church-gold" />
          <span>My Recent Attendance</span>
        </h2>
        
        {recentAttendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAttendance.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{record.sessionName}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <span className="text-church-gold">{record.eventType}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {record.present ? (
                    <span className="flex items-center space-x-1 text-green-600 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      <span>Present</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-red-600 font-semibold">
                      <XCircle className="w-5 h-5" />
                      <span>Absent</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My QR Code</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-white p-4 inline-block rounded-lg border-2 border-church-gold">
                <QRCodeSVG
                  id="my-qr-code"
                  value={memberProfile.memberId}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{memberProfile.fullName}</p>
                <p className="text-sm text-gray-600 font-mono">{memberProfile.memberId}</p>
              </div>
              <p className="text-xs text-gray-500">
                Show this QR code for quick attendance check-in
              </p>
              <button onClick={downloadQRCode} className="btn-primary w-full">
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPortal;
