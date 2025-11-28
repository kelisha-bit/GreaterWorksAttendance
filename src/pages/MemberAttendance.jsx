import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealtimeMemberData, useRealtimeAttendance } from '../hooks/useRealtimeMemberData';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  BarChart3,
  Clock,
  Activity,
  Filter,
  Download,
  Target,
  Flame,
  Award,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MemberAttendance = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const { member, loading: memberLoading, error: memberError } = useRealtimeMemberData(memberId);
  const { attendanceRecords, loading: attendanceLoading } = useRealtimeAttendance(memberId, member?.memberId);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
    streak: 0,
    lastAttended: null,
    monthlyAverage: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [eventTypeData, setEventTypeData] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');

  const loading = memberLoading || attendanceLoading;

  useEffect(() => {
    if (memberError) {
      toast.error(memberError);
      if (memberError === 'Member not found') {
        navigate('/members');
      }
    }
  }, [memberError, navigate]);

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      calculateStats();
      prepareChartData();
    }
  }, [attendanceRecords, filterPeriod, filterEventType]);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  const getFilteredRecords = () => {
    let filteredRecords = attendanceRecords;
    
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate;
      
      if (filterPeriod === '3months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      } else if (filterPeriod === '6months') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      } else if (filterPeriod === '1year') {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      }
      
      if (startDate) {
        filteredRecords = filteredRecords.filter(record => new Date(record.date) >= startDate);
      }
    }

    if (filterEventType !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.eventType === filterEventType);
    }

    return filteredRecords;
  };

  const calculateStats = () => {
    const records = getFilteredRecords();
    const totalSessions = records.length;
    const presentRecords = records.filter(r => r.present);
    const presentCount = presentRecords.length;
    const absentCount = totalSessions - presentCount;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // Calculate streak
    let streak = 0;
    let currentStreak = 0;
    let lastAttended = null;

    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const record of records) {
      if (record.present) {
        currentStreak++;
        if (!lastAttended) lastAttended = record.date;
      } else {
        if (currentStreak > streak) streak = currentStreak;
        currentStreak = 0;
      }
    }
    if (currentStreak > streak) streak = currentStreak;

    // Calculate monthly average
    const monthlyData = {};
    records.forEach(record => {
      const monthKey = format(new Date(record.date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { present: 0, total: 0 };
      }
      monthlyData[monthKey].total++;
      if (record.present) monthlyData[monthKey].present++;
    });

    const monthlyAverages = Object.values(monthlyData);
    const monthlyAverage = monthlyAverages.length > 0 
      ? Math.round(monthlyAverages.reduce((sum, m) => sum + (m.present / m.total * 100), 0) / monthlyAverages.length)
      : 0;

    setAttendanceStats({
      total: totalSessions,
      present: presentCount,
      absent: absentCount,
      percentage,
      streak,
      lastAttended,
      monthlyAverage
    });
  };

  const prepareChartData = () => {
    const records = getFilteredRecords();
    // Monthly attendance data
    const monthlyAttendance = {};
    records.forEach(record => {
      const monthKey = format(new Date(record.date), 'MMM yyyy');
      if (!monthlyAttendance[monthKey]) {
        monthlyAttendance[monthKey] = { month: monthKey, present: 0, absent: 0, total: 0 };
      }
      monthlyAttendance[monthKey].total++;
      if (record.present) {
        monthlyAttendance[monthKey].present++;
      } else {
        monthlyAttendance[monthKey].absent++;
      }
    });

    const monthlyArray = Object.values(monthlyAttendance)
      .slice(-12)
      .map(m => ({
        ...m,
        rate: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0
      }));

    setMonthlyData(monthlyArray);

    // Event type distribution
    const eventTypeDistribution = {};
    records.forEach(record => {
      const type = record.eventType || 'Service';
      if (!eventTypeDistribution[type]) {
        eventTypeDistribution[type] = { name: type, present: 0, absent: 0, total: 0 };
      }
      eventTypeDistribution[type].total++;
      if (record.present) {
        eventTypeDistribution[type].present++;
      } else {
        eventTypeDistribution[type].absent++;
      }
    });

    const eventTypeArray = Object.values(eventTypeDistribution).map(type => ({
      name: type.name,
      value: type.present,
      attendanceRate: type.total > 0 ? Math.round((type.present / type.total) * 100) : 0
    }));

    setEventTypeData(eventTypeArray);
  };

  const exportAttendanceReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('Greater Works City Church', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Member Attendance Report', 14, 28);
    
    // Member Info
    doc.setFontSize(12);
    doc.text(`Name: ${member.fullName}`, 14, 40);
    doc.text(`Member ID: ${member.memberId}`, 14, 47);
    doc.text(`Department: ${member.department}`, 14, 54);
    
    // Attendance Stats
    doc.setFontSize(14);
    doc.text('Attendance Statistics', 14, 68);
    doc.setFontSize(10);
    doc.text(`Total Sessions: ${attendanceStats.total}`, 14, 76);
    doc.text(`Present: ${attendanceStats.present}`, 14, 83);
    doc.text(`Absent: ${attendanceStats.absent}`, 14, 90);
    doc.text(`Attendance Rate: ${attendanceStats.percentage}%`, 14, 97);
    doc.text(`Current Streak: ${attendanceStats.streak} sessions`, 14, 104);
    doc.text(`Monthly Average: ${attendanceStats.monthlyAverage}%`, 14, 111);
    
    // Attendance History Table
    const tableData = attendanceRecords.slice(0, 20).map(record => [
      format(new Date(record.date), 'MMM dd, yyyy'),
      record.sessionName,
      record.eventType || 'Service',
      record.present ? 'Present' : 'Absent',
      record.checkInTime || '-'
    ]);
    
    doc.autoTable({
      startY: 120,
      head: [['Date', 'Session', 'Type', 'Status', 'Check-in Time']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`${member.fullName}_Attendance_Report.pdf`);
    toast.success('Attendance report exported successfully');
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate(`/members/${memberId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={exportAttendanceReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button onClick={() => navigate('/members')} className="hover:text-gray-900">Members</button>
        <span>/</span>
        <button onClick={() => navigate(`/members/${memberId}`)} className="hover:text-gray-900">{member.fullName}</button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Attendance</span>
      </div>

      {/* Member Info Header */}
      <div className="card bg-gradient-to-r from-church-gold to-church-lightGold">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{member.fullName}</h1>
            <p className="text-white opacity-90">{member.department} • {member.memberId}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{attendanceStats.percentage}%</p>
            <p className="text-white opacity-90">Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Time</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>

          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Events</option>
            <option value="Service">Sunday Service</option>
            <option value="Bible Study">Bible Study</option>
            <option value="Prayer Meeting">Prayer Meeting</option>
            <option value="Youth Service">Youth Service</option>
            <option value="Special Event">Special Event</option>
          </select>
        </div>
      </div>

      {/* Attendance Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-900">{attendanceStats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Present</p>
              <p className="text-2xl font-bold text-green-900">{attendanceStats.present}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">Absent</p>
              <p className="text-2xl font-bold text-red-900">{attendanceStats.absent}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Attendance Rate</p>
              <p className="text-2xl font-bold text-purple-900">{attendanceStats.percentage}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Current Streak</p>
              <p className="text-2xl font-bold text-orange-900">{attendanceStats.streak}</p>
            </div>
            <Flame className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-teal-50 to-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600 font-semibold">Monthly Avg</p>
              <p className="text-2xl font-bold text-teal-900">{attendanceStats.monthlyAverage}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-teal-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-church-gold" />
            Monthly Attendance Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#10B981" name="Present" />
              <Bar dataKey="absent" fill="#EF4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Type Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-church-gold" />
            Attendance by Event Type
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, attendanceRate }) => `${name} (${attendanceRate}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Rate Trend */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-church-gold" />
          Attendance Rate Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#D4AF37" strokeWidth={2} name="Attendance %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Attendance History */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-church-gold" />
          Attendance History
        </h2>
        
        {getFilteredRecords().length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredRecords().map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.sessionName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {record.eventType}
                      </span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.checkInTime || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberAttendance;
