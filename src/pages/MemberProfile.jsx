import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  QrCode,
  User,
  Edit2,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

const MemberProfile = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const [member, setMember] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const fetchMemberData = async () => {
    try {
      // Fetch member details
      const memberDoc = await getDoc(doc(db, 'members', memberId));
      
      if (!memberDoc.exists()) {
        toast.error('Member not found');
        navigate('/members');
        return;
      }

      const memberData = { id: memberDoc.id, ...memberDoc.data() };
      setMember(memberData);

      // Fetch attendance records
      await fetchAttendanceStats(memberData.memberId);
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast.error('Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (memberIdCode) => {
    try {
      // Get all attendance sessions
      const sessionsSnapshot = await getDocs(collection(db, 'attendance_sessions'));
      const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let presentCount = 0;
      let totalSessions = sessions.length;
      const recentRecords = [];

      // Check attendance for each session
      for (const session of sessions) {
        const recordsQuery = query(
          collection(db, 'attendance_records'),
          where('sessionId', '==', session.id),
          where('memberId', '==', memberIdCode)
        );
        
        const recordsSnapshot = await getDocs(recordsQuery);
        const wasPresent = !recordsSnapshot.empty;
        
        if (wasPresent) {
          presentCount++;
        }

        // Add to recent records (last 10)
        if (recentRecords.length < 10) {
          recentRecords.push({
            sessionName: session.sessionName,
            date: session.date,
            present: wasPresent
          });
        }
      }

      // Sort recent records by date (newest first)
      recentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

      const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      setAttendanceStats({
        total: totalSessions,
        present: presentCount,
        absent: totalSessions - presentCount,
        percentage
      });

      setRecentAttendance(recentRecords);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('member-qr-code');
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
      downloadLink.download = `${member.fullName}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/members')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Members</span>
        </button>
        {isLeader && (
          <button
            onClick={() => navigate(`/members`)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {member.profilePhotoURL ? (
              <img
                src={member.profilePhotoURL}
                alt={member.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-church-gold"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-church-gold bg-opacity-10 flex items-center justify-center border-4 border-church-gold">
                <User className="w-16 h-16 text-church-gold" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{member.fullName}</h1>
            <p className="text-lg text-gray-600 font-mono mb-4">{member.memberId}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-5 h-5 text-church-gold" />
                <span>{member.phoneNumber}</span>
              </div>
              
              {member.email && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail className="w-5 h-5 text-church-gold" />
                  <span>{member.email}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Users className="w-5 h-5 text-church-gold" />
                <span>{member.department}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-700">
                <User className="w-5 h-5 text-church-gold" />
                <span>{member.membershipType} • {member.gender}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Calendar className="w-5 h-5 text-church-gold" />
                <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setShowQRModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>View QR Code</span>
              </button>
            </div>
          </div>
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
              <p className="text-sm text-green-600 font-semibold">Present</p>
              <p className="text-3xl font-bold text-green-900">{attendanceStats.present}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">Absent</p>
              <p className="text-3xl font-bold text-red-900">{attendanceStats.absent}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Attendance Rate</p>
              <p className="text-3xl font-bold text-purple-900">{attendanceStats.percentage}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Attendance</h2>
        
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
                  <p className="text-sm text-gray-600">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
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
              <h2 className="text-xl font-bold text-gray-900">Member QR Code</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  id="member-qr-code"
                  value={member.memberId}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{member.fullName}</p>
                <p className="text-sm text-gray-600 font-mono">{member.memberId}</p>
              </div>
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

export default MemberProfile;
