import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
  TrendingUp,
  MapPin,
  Cake,
  Heart,
  Award,
  DollarSign,
  Activity,
  Briefcase,
  AlertCircle,
  Download,
  BarChart3,
  Target,
  Clock,
  Flame
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, differenceInYears } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const EnhancedMemberProfile = () => {
  console.log('🎉 EnhancedMemberProfile component loaded!');
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const [member, setMember] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
    streak: 0,
    lastAttended: null
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
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

      // Fetch all related data
      await Promise.all([
        fetchAttendanceStats(memberDoc.id),
        fetchContributions(memberDoc.id),
        fetchAchievements(memberDoc.id)
      ]);
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast.error('Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (memberDocId) => {
    try {
      // Get all attendance sessions
      const sessionsSnapshot = await getDocs(collection(db, 'attendance_sessions'));
      const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Get all attendance records for this member
      const recordsQuery = query(
        collection(db, 'attendance_records'),
        where('memberId', '==', memberDocId)
      );
      const recordsSnapshot = await getDocs(recordsQuery);
      const attendanceRecords = recordsSnapshot.docs.map(doc => doc.data());

      let presentCount = 0;
      let streak = 0;
      let currentStreak = 0;
      let lastAttended = null;
      const recentRecords = [];
      const monthlyData = {};

      // Process each session
      for (const session of sessions) {
        const wasPresent = attendanceRecords.some(r => r.sessionId === session.id);
        
        if (wasPresent) {
          presentCount++;
          if (!lastAttended) lastAttended = session.date;
          currentStreak++;
        } else {
          if (currentStreak > streak) streak = currentStreak;
          currentStreak = 0;
        }

        // Add to recent records (last 15)
        if (recentRecords.length < 15) {
          recentRecords.push({
            sessionName: session.name || session.sessionName,
            date: session.date,
            eventType: session.eventType,
            present: wasPresent
          });
        }

        // Monthly attendance data
        const monthKey = format(new Date(session.date), 'MMM yyyy');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, present: 0, total: 0 };
        }
        monthlyData[monthKey].total++;
        if (wasPresent) monthlyData[monthKey].present++;
      }

      if (currentStreak > streak) streak = currentStreak;

      const totalSessions = sessions.length;
      const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      setAttendanceStats({
        total: totalSessions,
        present: presentCount,
        absent: totalSessions - presentCount,
        percentage,
        streak,
        lastAttended
      });

      setRecentAttendance(recentRecords);
      
      // Convert monthly data to array and sort
      const monthlyArray = Object.values(monthlyData)
        .slice(-6)
        .map(m => ({
          ...m,
          rate: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0
        }));
      setMonthlyAttendance(monthlyArray);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const fetchContributions = async (memberDocId) => {
    try {
      const q = query(
        collection(db, 'contributions'),
        where('memberId', '==', memberDocId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const contributionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContributions(contributionsList.slice(0, 10));
    } catch (error) {
      console.error('Error fetching contributions:', error);
      setContributions([]);
    }
  };

  const fetchAchievements = async (memberDocId) => {
    try {
      const q = query(
        collection(db, 'achievements'),
        where('memberId', '==', memberDocId),
        orderBy('dateAwarded', 'desc')
      );
      const snapshot = await getDocs(q);
      const achievementsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAchievements(achievementsList);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
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

  const exportMemberReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('Greater Works City Church', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Member Profile Report', 14, 28);
    
    // Member Info
    doc.setFontSize(12);
    doc.text(`Name: ${member.fullName}`, 14, 40);
    doc.text(`Member ID: ${member.memberId}`, 14, 47);
    doc.text(`Department: ${member.department}`, 14, 54);
    doc.text(`Phone: ${member.phoneNumber}`, 14, 61);
    if (member.email) doc.text(`Email: ${member.email}`, 14, 68);
    
    // Attendance Stats
    doc.setFontSize(14);
    doc.text('Attendance Statistics', 14, 82);
    doc.setFontSize(10);
    doc.text(`Total Sessions: ${attendanceStats.total}`, 14, 90);
    doc.text(`Present: ${attendanceStats.present}`, 14, 97);
    doc.text(`Attendance Rate: ${attendanceStats.percentage}%`, 14, 104);
    doc.text(`Current Streak: ${attendanceStats.streak} sessions`, 14, 111);
    
    // Recent Attendance Table
    const tableData = recentAttendance.slice(0, 10).map(record => [
      format(new Date(record.date), 'MMM dd, yyyy'),
      record.sessionName,
      record.eventType || 'N/A',
      record.present ? 'Present' : 'Absent'
    ]);
    
    doc.autoTable({
      startY: 120,
      head: [['Date', 'Session', 'Type', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`${member.fullName}_Profile_Report.pdf`);
    toast.success('Report exported successfully');
  };

  const calculateAge = () => {
    if (!member?.dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(member.dateOfBirth));
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

  const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const age = calculateAge();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate('/members')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Members</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={exportMemberReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          {isLeader && (
            <button
              onClick={() => navigate(`/members`)}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
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
            <div className="flex flex-wrap gap-3 mb-4">
              <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded">
                <span className="font-semibold">ID:</span> {member.memberId}
              </p>
              {member.titheEnvelopeNumber && (
                <p className="text-sm text-church-gold font-mono bg-church-lightGold px-3 py-1 rounded">
                  <span className="font-semibold">Tithe Env:</span> {member.titheEnvelopeNumber}
                </p>
              )}
              {member.membershipStatus && (
                <p className={`text-sm font-semibold px-3 py-1 rounded ${
                  member.membershipStatus === 'Active' ? 'bg-green-100 text-green-800' :
                  member.membershipStatus === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                  member.membershipStatus === 'Transferred' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {member.membershipStatus}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>{member.phoneNumber}</span>
              </div>
              
              {member.email && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail className="w-5 h-5 text-church-gold flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Users className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>{member.department}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-700">
                <User className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>{member.membershipType} • {member.gender}</span>
              </div>
              
              {member.dateOfBirth && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Cake className="w-5 h-5 text-church-gold flex-shrink-0" />
                  <span>{age} years old</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Calendar className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>Joined {member.dateJoined ? format(new Date(member.dateJoined), 'MMM dd, yyyy') : new Date(member.createdAt).toLocaleDateString()}</span>
              </div>

              {member.address && (
                <div className="flex items-center space-x-3 text-gray-700 sm:col-span-2">
                  <MapPin className="w-5 h-5 text-church-gold flex-shrink-0" />
                  <span>{member.address}</span>
                </div>
              )}

              {member.weddingAnniversary && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Heart className="w-5 h-5 text-church-gold flex-shrink-0" />
                  <span>Anniversary: {format(new Date(member.weddingAnniversary), 'MMM dd')}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
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

      {/* Attendance Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Current Streak</p>
              <p className="text-3xl font-bold text-orange-900">{attendanceStats.streak}</p>
            </div>
            <Flame className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-church-gold" />
            Monthly Attendance Trend
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10B981" name="Present" />
              <Bar dataKey="total" fill="#D4AF37" name="Total Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Rate Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-church-gold" />
            Attendance Rate Trend
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#D4AF37" strokeWidth={2} name="Attendance %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contributions & Achievements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributions Summary */}
        {isLeader && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-church-gold" />
                Contributions
              </span>
              <span className="text-2xl font-bold text-church-gold">
                GH₵{totalContributions.toLocaleString()}
              </span>
            </h2>
            {contributions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No contributions recorded</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{contribution.type}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(contribution.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-church-gold">
                      GH₵{contribution.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-church-gold" />
            Achievements & Recognition
          </h2>
          {achievements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No achievements yet</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-church-lightGold to-white rounded-lg border border-church-gold">
                  <Award className="w-6 h-6 text-church-gold flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{achievement.title}</p>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(achievement.dateAwarded), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-church-gold" />
          Recent Attendance History
        </h2>
        
        {recentAttendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAttendance.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.sessionName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.eventType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.present ? (
                        <span className="flex items-center space-x-1 text-green-600 font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          <span>Present</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-red-600 font-semibold">
                          <XCircle className="w-4 h-4" />
                          <span>Absent</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Information */}
      {(member.emergencyContactName || member.emergencyContactPhone || member.occupation || member.baptismStatus || member.homeCell || member.salvationDate || member.previousChurch || member.skills || member.ministryInterests || member.notes) && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-church-gold" />
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(member.emergencyContactName || member.emergencyContactPhone) && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                  Emergency Contact
                </h3>
                {member.emergencyContactName && (
                  <p className="text-gray-600 mb-1">
                    <span className="font-medium">Name:</span> {member.emergencyContactName}
                  </p>
                )}
                {member.emergencyContactPhone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Phone:</span> {member.emergencyContactPhone}
                  </p>
                )}
              </div>
            )}
            {member.occupation && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-church-gold" />
                  Occupation
                </h3>
                <p className="text-gray-600">{member.occupation}</p>
              </div>
            )}
            {member.homeCell && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-church-gold" />
                  Home Cell/Group
                </h3>
                <p className="text-gray-600">{member.homeCell}</p>
              </div>
            )}
            {member.baptismStatus && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Baptism Status</h3>
                <p className="text-gray-600">{member.baptismStatus}</p>
                {member.baptismDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {format(new Date(member.baptismDate), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
            )}
            {member.salvationDate && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Salvation Date</h3>
                <p className="text-gray-600">{format(new Date(member.salvationDate), 'MMM dd, yyyy')}</p>
              </div>
            )}
            {member.maritalStatus && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Marital Status</h3>
                <p className="text-gray-600">{member.maritalStatus}</p>
              </div>
            )}
            {member.previousChurch && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Previous Church</h3>
                <p className="text-gray-600">{member.previousChurch}</p>
              </div>
            )}
            {member.skills && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Skills/Talents</h3>
                <p className="text-gray-600">{member.skills}</p>
              </div>
            )}
            {member.ministryInterests && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Ministry Interests</h3>
                <p className="text-gray-600">{member.ministryInterests}</p>
              </div>
            )}
          </div>
          {member.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{member.notes}</p>
            </div>
          )}
        </div>
      )}

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

export default EnhancedMemberProfile;
