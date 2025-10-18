import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Download, Calendar, TrendingUp, Users, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const Reports = () => {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalAttendance: 0,
    averageAttendance: 0,
    attendanceRate: 0
  });

  const departments = ['All', 'Choir', 'Ushering', 'Media', 'Children Ministry', 'Youth Ministry', 'Prayer Team', 'Welfare', 'Protocol', 'Other'];

  const COLORS = ['#D4AF37', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && members.length > 0) {
      calculateStats();
    }
  }, [sessions, members, attendanceRecords, dateRange, selectedDepartment]);

  const fetchData = async () => {
    try {
      // Fetch sessions
      const sessionsQuery = query(collection(db, 'attendance_sessions'), orderBy('date', 'desc'));
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

      // Fetch all attendance records
      const recordsSnapshot = await getDocs(collection(db, 'attendance_records'));
      const recordsList = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(recordsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSessions = () => {
    const now = new Date();
    let startDate;

    if (dateRange === 'week') {
      startDate = startOfWeek(now);
    } else if (dateRange === 'month') {
      startDate = startOfMonth(now);
    } else {
      // All time
      return sessions;
    }

    return sessions.filter(s => new Date(s.date) >= startDate);
  };

  const getFilteredMembers = () => {
    if (selectedDepartment === 'All') {
      return members;
    }
    return members.filter(m => m.department === selectedDepartment);
  };

  const calculateStats = () => {
    const filteredSessions = getFilteredSessions();
    const filteredMembers = getFilteredMembers();

    const totalSessions = filteredSessions.length;
    const totalAttendance = filteredSessions.reduce((sum, s) => sum + (s.attendeeCount || 0), 0);
    const averageAttendance = totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0;
    const attendanceRate = filteredMembers.length > 0 ? Math.round((averageAttendance / filteredMembers.length) * 100) : 0;

    setStats({
      totalSessions,
      totalAttendance,
      averageAttendance,
      attendanceRate
    });
  };

  const getAttendanceTrendData = () => {
    const filteredSessions = getFilteredSessions();
    return filteredSessions
      .slice(0, 10)
      .reverse()
      .map(session => ({
        name: format(new Date(session.date), 'MMM dd'),
        attendance: session.attendeeCount || 0
      }));
  };

  const getDepartmentData = () => {
    const deptCounts = {};
    members.forEach(member => {
      deptCounts[member.department] = (deptCounts[member.department] || 0) + 1;
    });

    return Object.entries(deptCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getMembershipTypeData = () => {
    const typeCounts = {};
    members.forEach(member => {
      typeCounts[member.membershipType] = (typeCounts[member.membershipType] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Greater Works Attendance Report', 14, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Report Period: ${dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : 'All Time'}`, 14, 30);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 37);
    
    // Stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 50);
    doc.setFontSize(11);
    doc.text(`Total Sessions: ${stats.totalSessions}`, 14, 58);
    doc.text(`Total Attendance: ${stats.totalAttendance}`, 14, 65);
    doc.text(`Average Attendance: ${stats.averageAttendance}`, 14, 72);
    doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 14, 79);
    
    // Sessions table
    const filteredSessions = getFilteredSessions();
    const tableData = filteredSessions.map(session => [
      format(new Date(session.date), 'MMM dd, yyyy'),
      session.name,
      session.eventType,
      session.attendeeCount || 0
    ]);
    
    doc.autoTable({
      startY: 90,
      head: [['Date', 'Session Name', 'Event Type', 'Attendance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Report exported successfully');
  };

  const exportToCSV = () => {
    const filteredSessions = getFilteredSessions();
    const headers = ['Date', 'Session Name', 'Event Type', 'Department', 'Attendance'];
    const rows = filteredSessions.map(session => [
      session.date,
      session.name,
      session.eventType,
      session.department,
      session.attendeeCount || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast.success('Report exported successfully');
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
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportToCSV} className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={exportToPDF} className="btn-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="label">
              <Filter className="w-4 h-4 inline mr-2" />
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input-field"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Attendance</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAttendance}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Attendance</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageAttendance}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</p>
            </div>
            <div className="bg-church-lightGold p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-church-darkGold" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getAttendanceTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attendance" stroke="#D4AF37" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getDepartmentData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getDepartmentData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Membership Type Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getMembershipTypeData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#D4AF37" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Sessions Summary */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {getFilteredSessions().slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{session.name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(session.date), 'MMM dd, yyyy')} • {session.eventType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-church-gold">{session.attendeeCount || 0}</p>
                  <p className="text-xs text-gray-600">attendees</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
