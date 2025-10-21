import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  TrendingUp,
  Award,
  Activity,
  UserCheck,
  Calendar,
  BarChart3,
  ArrowLeft
} from 'lucide-react';

const DepartmentDashboard = () => {
  const { currentUser, userRole, isViewer } = useAuth();
  const [primaryDepartment, setPrimaryDepartment] = useState('');
  const [userMember, setUserMember] = useState(null);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    avgAttendance: 0,
    topPerformer: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentData();
  }, [currentUser]);

  const fetchDepartmentData = async () => {
    try {
      // Find user's member profile to get department
      const memberQuery = query(
        collection(db, 'members'),
        where('email', '==', currentUser.email)
      );
      const memberSnapshot = await getDocs(memberQuery);
      
      if (memberSnapshot.empty) {
        setLoading(false);
        return;
      }

      const memberData = { id: memberSnapshot.docs[0].id, ...memberSnapshot.docs[0].data() };
      setUserMember(memberData);

      // Handle multiple departments - use the first department for now
      const userDepartments = Array.isArray(memberData.department) ? memberData.department : [memberData.department];
      const primaryDepartment = userDepartments[0];

      if (!primaryDepartment) {
        setLoading(false);
        return;
      }

      setPrimaryDepartment(primaryDepartment);

      // Fetch all members in the user's departments
      const deptQuery = query(
        collection(db, 'members'),
        where('department', 'array-contains', primaryDepartment)
      );
      const deptSnapshot = await getDocs(deptQuery);
      const deptMembers = deptSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setDepartmentMembers(deptMembers);

      // Calculate department statistics
      const totalMembers = deptMembers.length;
      
      // Fetch attendance records for department members
      const attendanceRecords = await getDocs(collection(db, 'attendance_records'));
      const records = attendanceRecords.docs.map(doc => doc.data());

      // Calculate attendance for each member
      const memberAttendance = {};
      deptMembers.forEach(member => {
        const memberRecords = records.filter(r => r.memberId === member.memberId);
        memberAttendance[member.memberId] = {
          name: member.fullName,
          count: memberRecords.length
        };
      });

      // Find top performer
      const topPerformer = Object.values(memberAttendance)
        .sort((a, b) => b.count - a.count)[0];

      // Calculate average attendance
      const totalAttendance = Object.values(memberAttendance)
        .reduce((sum, m) => sum + m.count, 0);
      const avgAttendance = totalMembers > 0 ? Math.round(totalAttendance / totalMembers) : 0;

      // Count active members (attended at least once in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sessionsSnapshot = await getDocs(collection(db, 'attendance_sessions'));
      const recentSessions = sessionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => new Date(s.date) >= thirtyDaysAgo);

      const recentSessionIds = recentSessions.map(s => s.id);
      const recentRecords = records.filter(r => recentSessionIds.includes(r.sessionId));
      const activeMemberIds = new Set(
        recentRecords
          .filter(r => deptMembers.some(m => m.memberId === r.memberId))
          .map(r => r.memberId)
      );

      setDepartmentStats({
        totalMembers,
        activeMembers: activeMemberIds.size,
        avgAttendance,
        topPerformer
      });

    } catch (error) {
      console.error('Error fetching department data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userMember || (Array.isArray(userMember.department) ? userMember.department.length === 0 : !userMember.department)) {
    return (
      <div className="card text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Department Assigned</h2>
        <p className="text-gray-600">You need to be assigned to a department to view this dashboard.</p>
        <Link to="/" className="text-church-gold hover:text-church-darkGold mt-4 inline-block">
          Go to Main Dashboard
        </Link>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Members',
      value: departmentStats.totalMembers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Members',
      value: departmentStats.activeMembers,
      subtitle: 'Last 30 days',
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg Attendance',
      value: departmentStats.avgAttendance,
      subtitle: 'Per member',
      icon: Activity,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Top Performer',
      value: departmentStats.topPerformer?.name || 'N/A',
      subtitle: `${departmentStats.topPerformer?.count || 0} sessions`,
      icon: Award,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Department Header */}
      <div className="card bg-gradient-to-r from-church-gold to-church-darkGold text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{primaryDepartment} Department</h1>
            <p className="opacity-90">
              {isViewer ? 'Department Overview' : 'Department Leader Dashboard'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Department Members</h2>
          <span className="text-sm text-gray-600">{departmentMembers.length} members</span>
        </div>

        {departmentMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No members in this department yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Member ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody>
                {departmentMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{member.memberId}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{member.fullName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.phoneNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {member.membershipType || 'Adult'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions - Only show for non-viewers */}
      {!isViewer && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Department Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/members"
              className="card hover:shadow-lg transition-all cursor-pointer group hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">View All Members</h3>
                  <p className="text-sm text-gray-600">Manage department members</p>
                </div>
              </div>
            </Link>

            <Link
              to="/reports"
              className="card hover:shadow-lg transition-all cursor-pointer group hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Department Reports</h3>
                  <p className="text-sm text-gray-600">View attendance analytics</p>
                </div>
              </div>
            </Link>

            <Link
              to="/attendance"
              className="card hover:shadow-lg transition-all cursor-pointer group hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-green-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Attendance</h3>
                  <p className="text-sm text-gray-600">Track department attendance</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;
