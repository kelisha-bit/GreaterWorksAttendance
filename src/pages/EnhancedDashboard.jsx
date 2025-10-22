import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  ClipboardCheck, 
  Calendar, 
  TrendingUp,
  UserPlus,
  PlusCircle,
  BarChart3,
  DollarSign,
  UserCheck,
  AlertCircle,
  Award,
  Activity,
  Eye,
  Settings as SettingsIcon
} from 'lucide-react';
import { format } from 'date-fns';

const EnhancedDashboard = () => {
  const { userRole, currentUser, isViewer, isLeader } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalVisitors: 0,
    todayAttendance: 0,
    thisWeekAttendance: 0,
    attendanceRate: 0,
    totalContributions: 0,
    thisMonthContributions: 0,
    pendingFollowUps: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [userMember, setUserMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole, currentUser]);

  const fetchDashboardData = async () => {
    try {
      // Common data for all roles
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const totalMembers = membersSnapshot.size;

      // Fetch recent attendance sessions
      const sessionsSnapshot = await getDocs(collection(db, 'attendance_sessions'));
      let sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentSessions = sessions.slice(0, 5);

      // Calculate attendance stats
      const today = new Date().toISOString().split('T')[0];
      const todaySession = sessions.find(s => s.date === today);
      const todayAttendance = todaySession?.attendeeCount || 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekSessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
      const weekTotal = weekSessions.reduce((sum, s) => sum + (s.attendeeCount || 0), 0);
      const thisWeekAttendance = weekSessions.length > 0 ? Math.round(weekTotal / weekSessions.length) : 0;
      const attendanceRate = totalMembers > 0 ? Math.round((thisWeekAttendance / totalMembers) * 100) : 0;

      let newStats = {
        totalMembers,
        todayAttendance,
        thisWeekAttendance,
        attendanceRate
      };

      setRecentSessions(recentSessions);

      // Admin/Leader specific data - viewers get limited data
      if (userRole === 'admin' || userRole === 'leader' || userRole === 'viewer') {
        // Fetch visitors
        const visitorsSnapshot = await getDocs(collection(db, 'visitors'));
        const visitors = visitorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        visitors.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
        
        newStats.totalVisitors = visitors.length;
        newStats.pendingFollowUps = visitors.filter(v => 
          v.followUpStatus === 'Pending' || v.followUpStatus === 'Scheduled'
        ).length;
        setRecentVisitors(visitors.slice(0, 5));

        // Fetch contributions
        const contributionsSnapshot = await getDocs(collection(db, 'contributions'));
        const contributions = contributionsSnapshot.docs.map(doc => doc.data());
        
        const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthContributions = contributions
          .filter(c => c.date.startsWith(currentMonth))
          .reduce((sum, c) => sum + c.amount, 0);

        newStats.totalContributions = totalContributions;
        newStats.thisMonthContributions = thisMonthContributions;

        // Calculate top contributors
        const contributorTotals = {};
        contributions.forEach(c => {
          if (!contributorTotals[c.memberId]) {
            contributorTotals[c.memberId] = {
              name: c.memberName,
              total: 0
            };
          }
          contributorTotals[c.memberId].total += c.amount;
        });

        const topContributors = Object.values(contributorTotals)
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setTopContributors(topContributors);
      }

      // Member specific data
      if (userRole !== 'admin' && userRole !== 'leader') {
        // Find user's member profile
        const memberQuery = query(
          collection(db, 'members'),
          where('email', '==', currentUser.email)
        );
        const memberSnapshot = await getDocs(memberQuery);
        if (!memberSnapshot.empty) {
          const memberData = { id: memberSnapshot.docs[0].id, ...memberSnapshot.docs[0].data() };
          setUserMember(memberData);

          // Get user's attendance
          const userAttendanceRecords = await getDocs(
            query(
              collection(db, 'attendance_records'),
              where('memberId', '==', memberData.memberId)
            )
          );
          newStats.myAttendanceCount = userAttendanceRecords.size;
        }
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  // Role-based stat cards
  const getStatCards = () => {
    const commonCards = [
      {
        title: 'Total Members',
        value: stats.totalMembers,
        icon: Users,
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        show: true
      },
      {
        title: "Today's Attendance",
        value: stats.todayAttendance,
        icon: ClipboardCheck,
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        show: true
      },
      {
        title: 'Weekly Average',
        value: stats.thisWeekAttendance,
        icon: Calendar,
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50',
        show: true
      },
      {
        title: 'Attendance Rate',
        value: `${stats.attendanceRate}%`,
        icon: TrendingUp,
        color: 'bg-church-gold',
        textColor: 'text-church-darkGold',
        bgColor: 'bg-church-lightGold',
        show: true
      }
    ];

    const adminLeaderCards = [
      {
        title: 'Total Visitors',
        value: stats.totalVisitors || 0,
        icon: UserPlus,
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50',
        show: userRole === 'admin' || userRole === 'leader'
      },
      {
        title: 'Pending Follow-ups',
        value: stats.pendingFollowUps || 0,
        icon: AlertCircle,
        color: 'bg-red-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        show: userRole === 'admin' || userRole === 'leader'
      },
      {
        title: 'This Month Giving',
        value: formatCurrency(stats.thisMonthContributions || 0),
        icon: DollarSign,
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        show: userRole === 'admin' || userRole === 'leader'
      },
      {
        title: 'Total Contributions',
        value: formatCurrency(stats.totalContributions || 0),
        icon: Award,
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        show: userRole === 'admin' || userRole === 'leader'
      }
    ];

    const memberCards = [
      {
        title: 'My Attendance',
        value: stats.myAttendanceCount || 0,
        icon: Activity,
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        show: userRole !== 'admin' && userRole !== 'leader'
      }
    ];

    return [...commonCards, ...adminLeaderCards, ...memberCards].filter(card => card.show);
  };

  // Role-based quick actions
  const getQuickActions = () => {
    const actions = [
      {
        title: 'Register Member',
        description: 'Add a new church member',
        icon: UserPlus,
        link: isViewer ? '#' : '/members',
        color: 'bg-blue-500',
        show: isLeader, // Only show for leaders/admins
        disabled: isViewer
      },
      {
        title: 'Register Visitor',
        description: 'Add a new visitor',
        icon: UserCheck,
        link: isViewer ? '#' : '/visitors',
        color: 'bg-orange-500',
        show: isLeader, // Only show for leaders/admins
        disabled: isViewer
      },
      {
        title: 'Create Session',
        description: 'Start new attendance session',
        icon: PlusCircle,
        link: isViewer ? '#' : '/attendance',
        color: 'bg-green-500',
        show: isLeader, // Only show for leaders/admins
        disabled: isViewer
      },
      {
        title: 'Record Contribution',
        description: 'Add financial contribution',
        icon: DollarSign,
        link: isViewer ? '#' : '/contributions',
        color: 'bg-yellow-500',
        show: isLeader, // Only show for leaders/admins
        disabled: isViewer
      },
      {
        title: 'View Reports',
        description: 'Check attendance analytics',
        icon: BarChart3,
        link: isViewer ? '#' : '/reports',
        color: 'bg-purple-500',
        show: true,
        disabled: isViewer
      },
      {
        title: 'My Portal',
        description: 'View your personal dashboard',
        icon: Eye,
        link: '/my-portal',
        color: 'bg-indigo-500',
        show: userRole !== 'admin' && userRole !== 'leader' || isViewer
      }
    ];

    return actions.filter(action => action.show);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = getStatCards();
  const quickActions = getQuickActions();

  // Render the dashboard
  return (
    <div className="space-y-6">
      {/* Welcome Header - Role-based */}
      <div className="card bg-gradient-to-r from-church-gold to-church-darkGold text-white relative">
        {isViewer && (
          <div className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            View Only
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold mb-2">
                {userRole === 'admin' && 'Admin Dashboard'}
                {userRole === 'leader' && 'Leader Dashboard'}
                {userRole === 'viewer' && 'Viewer Dashboard'}
                {userRole !== 'admin' && userRole !== 'leader' && userRole !== 'viewer' && 'Member Dashboard'}
              </h1>
            </div>
            <p className="opacity-90">
              {userRole === 'admin' && 'Full system access and management'}
              {userRole === 'leader' && 'Manage your department and track progress'}
              {userRole === 'viewer' && 'View-only access to system information'}
              {userRole !== 'admin' && userRole !== 'leader' && userRole !== 'viewer' && 'Welcome to Greater Works Church'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {userRole === 'admin' && <SettingsIcon className="w-8 h-8" />}
              {userRole === 'leader' && <Award className="w-8 h-8" />}
              {userRole !== 'admin' && userRole !== 'leader' && <Users className="w-8 h-8" />}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Dynamic based on role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="h-full">
            <div className={`card h-full ${stat.color} text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change !== undefined && (
                    <p className={`text-xs mt-1 ${stat.change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                      {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}% from last period
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-full bg-black bg-opacity-10">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isViewer ? 'Available Actions' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`card transition-shadow ${
                action.disabled 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-lg cursor-pointer group'
              }`}
              onClick={(e) => {
                if (action.disabled) {
                  e.preventDefault();
                }
              }}
              aria-disabled={action.disabled}
            >
              <div className="flex items-start space-x-4">
                <div 
                  className={`${action.color} p-3 rounded-lg ${
                    !action.disabled ? 'group-hover:scale-110' : ''
                  } transition-transform`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                    {action.disabled && (
                      <span className="ml-2 text-xs text-gray-500">(View Only)</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Admin/Leader Specific Widgets */}
      {(userRole === 'admin' || userRole === 'leader') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Visitors */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Visitors</h2>
              <Link to="/visitors" className="text-church-gold hover:text-church-darkGold text-sm">
                View All
              </Link>
            </div>
            {recentVisitors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No visitors yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVisitors.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{visitor.fullName}</p>
                      <p className="text-sm text-gray-600">{visitor.visitType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(visitor.visitDate).toLocaleDateString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        visitor.followUpStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        visitor.followUpStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {visitor.followUpStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Contributors */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top Contributors</h2>
              <Link to="/financial-reports" className="text-church-gold hover:text-church-darkGold text-sm">
                View All
              </Link>
            </div>
            {topContributors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No contributions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <p className="font-semibold text-gray-900">{contributor.name}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(contributor.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Sessions - All Roles */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Attendance Sessions</h2>
          <Link to="/attendance" className="text-church-gold hover:text-church-darkGold text-sm">
            View All
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No attendance sessions yet</p>
            {(userRole === 'admin' || userRole === 'leader') && (
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
                      {session.attendeeCount || 0}
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

export default EnhancedDashboard;
