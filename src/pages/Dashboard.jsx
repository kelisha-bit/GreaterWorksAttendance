import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  useAttendanceSessions, 
  useAllAttendanceRecords,
  useMembers
} from '../hooks/useAttendanceData';
import { 
  Users, 
  ClipboardCheck, 
  Calendar, 
  TrendingUp,
  UserPlus,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { isLeader } = useAuth();
  
  // Use our custom hooks for real-time data
  const { sessions } = useAttendanceSessions();
  const { members } = useMembers();
  const { getAttendanceCountForSession } = useAllAttendanceRecords();
  
  // Get recent sessions (limit to 5)
  const recentSessions = sessions.slice(0, 5);
  
  // Calculate stats from real-time data
  const totalMembers = members.length;
  
  // Calculate today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todaySession = recentSessions.find(s => s.date === today);
  const todayAttendance = todaySession ? getAttendanceCountForSession(todaySession.id) : 0;
  
  // Calculate this week's average attendance
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekSessions = recentSessions.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= oneWeekAgo;
  });
  const weekTotal = weekSessions.reduce((sum, s) => sum + getAttendanceCountForSession(s.id), 0);
  const thisWeekAttendance = weekSessions.length > 0 ? Math.round(weekTotal / weekSessions.length) : 0;
  
  // Calculate attendance rate
  const attendanceRate = totalMembers > 0 ? Math.round((thisWeekAttendance / totalMembers) * 100) : 0;
  
  const stats = {
    totalMembers,
    todayAttendance,
    thisWeekAttendance,
    attendanceRate
  };

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      icon: ClipboardCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Weekly Average',
      value: stats.thisWeekAttendance,
      icon: Calendar,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: TrendingUp,
      color: 'bg-church-gold',
      textColor: 'text-church-darkGold',
      bgColor: 'bg-church-lightGold'
    }
  ];

  const quickActions = [
    {
      title: 'Register Member',
      description: 'Add a new church member',
      icon: UserPlus,
      link: '/members',
      color: 'bg-blue-500',
      show: isLeader
    },
    {
      title: 'Create Session',
      description: 'Start new attendance session',
      icon: PlusCircle,
      link: '/attendance',
      color: 'bg-green-500',
      show: isLeader
    },
    {
      title: 'View Reports',
      description: 'Check attendance analytics',
      icon: BarChart3,
      link: '/reports',
      color: 'bg-purple-500',
      show: true
    }
  ].filter(action => action.show);


  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Greater Works Attendance Tracker
        </h1>
        <p className="text-gray-600">
          Manage your church attendance efficiently and effectively
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Attendance Sessions</h2>
        <div className="card">
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No attendance sessions yet</p>
              {isLeader && (
                <Link to="/attendance" className="text-church-gold hover:text-church-darkGold mt-2 inline-block">
                  Create your first session
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Session Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{session.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(session.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{session.eventType}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        {getAttendanceCountForSession(session.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
