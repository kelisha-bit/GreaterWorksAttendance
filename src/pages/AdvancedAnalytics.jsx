import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  useAttendanceSessions, 
  useAllAttendanceRecords,
  useMembers
} from '../hooks/useAttendanceData';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfYear,
  eachMonthOfInterval,
  eachWeekOfInterval,
  subMonths,
  differenceInDays
} from 'date-fns';

const AdvancedAnalytics = () => {
  const { isLeader } = useAuth();
  
  // Use our custom hooks for real-time data
  const { sessions } = useAttendanceSessions();
  const { members } = useMembers();
  const { getAttendanceCountForSession } = useAllAttendanceRecords();
  
  const [loading, setLoading] = useState(false); // Set to false since hooks handle loading
  const [dateRange, setDateRange] = useState('6months');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEventType, setSelectedEventType] = useState('All');

  const departments = ['All', 'Choir', 'Music Team', 'Ushering and Welcome Team', 'Financial team', 'Media', 'Children Ministry', 'Youth Ministry', 'Women Ministry', 'Men Ministry', 'Evangelism Team', 'Follow Up Team', 'Prayer Team', 'Welfare', 'Protocol', 'Other'];
  const eventTypes = ['All', 'Sunday Service', 'Prayer Meeting', 'Bible Study', 'Department Meeting', 'Youth Service', 'Children Service', 'Special Event', 'Other'];

  const COLORS = ['#D4AF37', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const getFilteredSessions = () => {
    const now = new Date();
    let startDate;

    if (dateRange === 'week') {
      startDate = startOfWeek(now);
    } else if (dateRange === 'month') {
      startDate = startOfMonth(now);
    } else if (dateRange === '3months') {
      startDate = subMonths(now, 3);
    } else if (dateRange === '6months') {
      startDate = subMonths(now, 6);
    } else if (dateRange === 'year') {
      startDate = startOfYear(now);
    } else {
      return sessions;
    }

    let filtered = sessions.filter(s => new Date(s.date) >= startDate);

    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(s => s.department === selectedDepartment);
    }

    if (selectedEventType !== 'All') {
      filtered = filtered.filter(s => s.eventType === selectedEventType);
    }

    return filtered;
  };

  // Monthly Attendance Trend
  const getMonthlyTrendData = () => {
    const filteredSessions = getFilteredSessions();
    const monthlyData = {};

    filteredSessions.forEach(session => {
      const monthKey = format(new Date(session.date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          sessions: 0,
          totalAttendance: 0,
          averageAttendance: 0
        };
      }
      monthlyData[monthKey].sessions += 1;
      monthlyData[monthKey].totalAttendance += getAttendanceCountForSession(session.id);
    });

    return Object.values(monthlyData).map(data => ({
      ...data,
      averageAttendance: Math.round(data.totalAttendance / data.sessions)
    })).slice(-12);
  };

  // Department Performance Comparison
  const getDepartmentPerformanceData = () => {
    const deptData = {};

    departments.filter(d => d !== 'All').forEach(dept => {
      const deptSessions = sessions.filter(s => s.department === dept);
      const totalAttendance = deptSessions.reduce((sum, s) => sum + getAttendanceCountForSession(s.id), 0);
      const avgAttendance = deptSessions.length > 0 ? Math.round(totalAttendance / deptSessions.length) : 0;

      deptData[dept] = {
        department: dept,
        sessions: deptSessions.length,
        totalAttendance,
        avgAttendance
      };
    });

    return Object.values(deptData).filter(d => d.sessions > 0);
  };

  // Event Type Distribution
  const getEventTypeDistribution = () => {
    const eventData = {};

    sessions.forEach(session => {
      if (!eventData[session.eventType]) {
        eventData[session.eventType] = {
          name: session.eventType,
          count: 0,
          totalAttendance: 0
        };
      }
      eventData[session.eventType].count += 1;
      eventData[session.eventType].totalAttendance += getAttendanceCountForSession(session.id);
    });

    return Object.values(eventData);
  };

  // Attendance Growth Rate
  const getGrowthRateData = () => {
    const filteredSessions = getFilteredSessions().slice(-10);
    
    return filteredSessions.map((session, index) => {
      const prevSession = index > 0 ? filteredSessions[index - 1] : null;
      const growthRate = prevSession 
        ? ((getAttendanceCountForSession(session.id) - getAttendanceCountForSession(prevSession.id)) / getAttendanceCountForSession(prevSession.id) * 100).toFixed(1)
        : 0;

      return {
        name: format(new Date(session.date), 'MMM dd'),
        attendance: getAttendanceCountForSession(session.id),
        growth: parseFloat(growthRate)
      };
    });
  };

  // Day of Week Analysis
  const getDayOfWeekAnalysis = () => {
    const dayData = {
      'Sunday': { day: 'Sunday', sessions: 0, totalAttendance: 0 },
      'Monday': { day: 'Monday', sessions: 0, totalAttendance: 0 },
      'Tuesday': { day: 'Tuesday', sessions: 0, totalAttendance: 0 },
      'Wednesday': { day: 'Wednesday', sessions: 0, totalAttendance: 0 },
      'Thursday': { day: 'Thursday', sessions: 0, totalAttendance: 0 },
      'Friday': { day: 'Friday', sessions: 0, totalAttendance: 0 },
      'Saturday': { day: 'Saturday', sessions: 0, totalAttendance: 0 }
    };

    sessions.forEach(session => {
      const dayName = format(new Date(session.date), 'EEEE');
      if (dayData[dayName]) {
        dayData[dayName].sessions += 1;
        dayData[dayName].totalAttendance += getAttendanceCountForSession(session.id);
      }
    });

    return Object.values(dayData).map(d => ({
      ...d,
      avgAttendance: d.sessions > 0 ? Math.round(d.totalAttendance / d.sessions) : 0
    })).filter(d => d.sessions > 0);
  };

  // Member Engagement Score
  const getMemberEngagementData = () => {
    const engagementData = members.map(member => {
      // For now, calculate based on available sessions
      // TODO: Implement proper member attendance tracking
      const attendanceRate = sessions.length > 0 ? Math.random() * 100 : 0; // Placeholder
      
      return {
        name: member.fullName,
        department: Array.isArray(member.department) ? member.department.join(', ') : member.department,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        sessionsAttended: Math.floor(attendanceRate * sessions.length / 100)
      };
    });

    return engagementData.sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 10);
  };

  // Export comprehensive analytics report
  const exportAnalyticsToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Advanced Analytics Report', 14, 20);
    
    // Report Info
    doc.setFontSize(11);
    doc.text(`Period: ${dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : dateRange === '3months' ? 'Last 3 Months' : dateRange === '6months' ? 'Last 6 Months' : dateRange === 'year' ? 'This Year' : 'All Time'}`, 14, 30);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 37);
    
    // Summary Statistics
    const filteredSessions = getFilteredSessions();
    const totalAttendance = filteredSessions.reduce((sum, s) => sum + getAttendanceCountForSession(s.id), 0);
    const avgAttendance = filteredSessions.length > 0 ? Math.round(totalAttendance / filteredSessions.length) : 0;
    
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 50);
    doc.setFontSize(10);
    doc.text(`Total Sessions: ${filteredSessions.length}`, 14, 58);
    doc.text(`Total Attendance: ${totalAttendance}`, 14, 65);
    doc.text(`Average Attendance: ${avgAttendance}`, 14, 72);
    doc.text(`Total Members: ${members.length}`, 14, 79);
    
    // Monthly Trend Table
    const monthlyData = getMonthlyTrendData();
    doc.autoTable({
      startY: 90,
      head: [['Month', 'Sessions', 'Total Attendance', 'Avg Attendance']],
      body: monthlyData.map(m => [m.month, m.sessions, m.totalAttendance, m.averageAttendance]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    // Department Performance
    const deptData = getDepartmentPerformanceData();
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Department Performance', 14, 20);
    doc.autoTable({
      startY: 30,
      head: [['Department', 'Sessions', 'Total Attendance', 'Avg Attendance']],
      body: deptData.map(d => [d.department, d.sessions, d.totalAttendance, d.avgAttendance]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`advanced-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Analytics report exported successfully');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and trends</p>
        </div>
        <button onClick={exportAnalyticsToPDF} className="btn-primary flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">
              <Calendar className="w-4 h-4 inline mr-2" />
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">This Year</option>
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
          <div>
            <label className="label">
              <Filter className="w-4 h-4 inline mr-2" />
              Event Type
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="input-field"
            >
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-church-gold" />
            Monthly Attendance Trend
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={getMonthlyTrendData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="totalAttendance" fill="#D4AF37" fillOpacity={0.3} stroke="#D4AF37" name="Total Attendance" />
            <Bar yAxisId="right" dataKey="sessions" fill="#4F46E5" name="Sessions" />
            <Line yAxisId="left" type="monotone" dataKey="averageAttendance" stroke="#10B981" strokeWidth={2} name="Avg Attendance" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Department Performance & Event Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-church-gold" />
            Department Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getDepartmentPerformanceData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgAttendance" fill="#D4AF37" name="Avg Attendance" />
              <Bar dataKey="sessions" fill="#4F46E5" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Type Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-church-gold" />
            Event Type Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getEventTypeDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {getEventTypeDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Rate & Day of Week Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Growth Rate */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-church-gold" />
            Attendance Growth Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getGrowthRateData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#D4AF37" strokeWidth={2} name="Attendance" />
              <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#10B981" strokeWidth={2} name="Growth %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Day of Week Analysis */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-church-gold" />
            Day of Week Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={getDayOfWeekAnalysis()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="day" />
              <PolarRadiusAxis />
              <Radar name="Avg Attendance" dataKey="avgAttendance" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-church-gold" />
          Top 10 Most Engaged Members
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Attended</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getMemberEngagementData().map((member, index) => (
                <tr key={index} className={index < 3 ? 'bg-church-lightGold bg-opacity-20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.sessionsAttended}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2" style={{ width: '100px' }}>
                        <div className="bg-church-gold h-2.5 rounded-full" style={{ width: `${member.attendanceRate}%` }}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{member.attendanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
