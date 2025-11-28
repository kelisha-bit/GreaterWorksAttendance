import { useState, useEffect, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  useMembers, 
  useAttendanceSessions, 
  useAllAttendanceRecords 
} from '../hooks/useAttendanceData';
import { 
  Award, 
  Trophy, 
  Star,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Medal,
  Crown,
  Zap,
  Heart,
  CheckCircle,
  Gift,
  Sparkles,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const Achievements = () => {
  const { userRole } = useAuth();
  const { members, loading: membersLoading } = useMembers();
  const { sessions, loading: sessionsLoading } = useAttendanceSessions();
  const { allRecords, loading: recordsLoading } = useAllAttendanceRecords();
  const [memberStats, setMemberStats] = useState([]);
  const [view, setView] = useState('badges'); // badges, leaderboard, milestones

  // Badge definitions
  const badges = [
    {
      id: 'newcomer',
      name: 'Newcomer',
      description: 'Attended first service',
      icon: Star,
      color: 'bg-blue-500',
      requirement: 1,
      category: 'attendance'
    },
    {
      id: 'regular',
      name: 'Regular Attendee',
      description: 'Attended 5 services',
      icon: CheckCircle,
      color: 'bg-green-500',
      requirement: 5,
      category: 'attendance'
    },
    {
      id: 'committed',
      name: 'Committed Member',
      description: 'Attended 10 services',
      icon: Heart,
      color: 'bg-pink-500',
      requirement: 10,
      category: 'attendance'
    },
    {
      id: 'dedicated',
      name: 'Dedicated Servant',
      description: 'Attended 25 services',
      icon: Award,
      color: 'bg-purple-500',
      requirement: 25,
      category: 'attendance'
    },
    {
      id: 'faithful',
      name: 'Faithful Member',
      description: 'Attended 50 services',
      icon: Trophy,
      color: 'bg-yellow-500',
      requirement: 50,
      category: 'attendance'
    },
    {
      id: 'champion',
      name: 'Church Champion',
      description: 'Attended 100 services',
      icon: Crown,
      color: 'bg-orange-500',
      requirement: 100,
      category: 'attendance'
    },
    {
      id: 'streak_3',
      name: '3-Week Streak',
      description: '3 consecutive weeks',
      icon: Flame,
      color: 'bg-red-500',
      requirement: 3,
      category: 'streak'
    },
    {
      id: 'streak_5',
      name: '5-Week Streak',
      description: '5 consecutive weeks',
      icon: Flame,
      color: 'bg-red-600',
      requirement: 5,
      category: 'streak'
    },
    {
      id: 'streak_10',
      name: '10-Week Streak',
      description: '10 consecutive weeks',
      icon: Zap,
      color: 'bg-red-700',
      requirement: 10,
      category: 'streak'
    },
    {
      id: 'perfect_month',
      name: 'Perfect Month',
      description: 'All services in a month',
      icon: Calendar,
      color: 'bg-indigo-500',
      requirement: 1,
      category: 'perfect'
    },
    {
      id: 'perfect_quarter',
      name: 'Perfect Quarter',
      description: 'All services in 3 months',
      icon: Target,
      color: 'bg-indigo-600',
      requirement: 1,
      category: 'perfect'
    },
    {
      id: 'perfect_year',
      name: 'Perfect Year',
      description: 'All services in a year',
      icon: Sparkles,
      color: 'bg-indigo-700',
      requirement: 1,
      category: 'perfect'
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Attended 10 morning services',
      icon: TrendingUp,
      color: 'bg-cyan-500',
      requirement: 10,
      category: 'special'
    },
    {
      id: 'team_player',
      name: 'Team Player',
      description: 'Brought 5 guests',
      icon: Users,
      color: 'bg-teal-500',
      requirement: 5,
      category: 'special'
    }
  ];

  useEffect(() => {
    if (membersLoading || sessionsLoading || recordsLoading) return;
    if (!members.length || !sessions.length) {
      setMemberStats([]);
      return;
    }

    try {
      const stats = calculateMemberStats(members, allRecords, sessions);
      setMemberStats(stats);
    } catch (error) {
      console.error('Error calculating member stats:', error);
      toast.error('Failed to process achievements data');
    }
  }, [members, allRecords, sessions, membersLoading, sessionsLoading, recordsLoading]);

  useEffect(() => {
    if (memberStats.length === 0) return;

    const persistBadges = async () => {
      try {
        await awardBadges(memberStats);
      } catch (error) {
        console.error('Error saving achievements:', error);
      }
    };

    persistBadges();
  }, [memberStats]);

  const calculateMemberStats = (members, records, sessions) => {
    return members.map(member => {
      const identifiers = [member.memberId, member.id].filter(Boolean);
      const memberRecords = records.filter(r => identifiers.includes(r.memberId));
      const totalAttendance = memberRecords.length;

      // Sort records by date
      const sortedRecords = memberRecords
        .map(r => {
          const session = sessions.find(s => s.id === r.sessionId);
          return { ...r, date: session?.date };
        })
        .filter(r => r.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate current streak
      const currentStreak = calculateCurrentStreak(sortedRecords);

      // Calculate longest streak
      const longestStreak = calculateLongestStreak(sortedRecords);

      // Calculate perfect attendance periods
      const perfectMonth = checkPerfectMonth(sortedRecords, sessions);
      const perfectQuarter = checkPerfectQuarter(sortedRecords, sessions);
      const perfectYear = checkPerfectYear(sortedRecords, sessions);

      // Calculate earned badges
      const earnedBadges = calculateEarnedBadges({
        totalAttendance,
        currentStreak,
        longestStreak,
        perfectMonth,
        perfectQuarter,
        perfectYear
      });

      return {
        member,
        totalAttendance,
        currentStreak,
        longestStreak,
        perfectMonth,
        perfectQuarter,
        perfectYear,
        earnedBadges,
        badgeCount: earnedBadges.length,
        lastAttendance: sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1].date : null
      };
    });
  };

  const calculateCurrentStreak = (sortedRecords) => {
    if (sortedRecords.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(sortedRecords[sortedRecords.length - 1].date);

    // Check if last attendance was within the last week
    const daysSinceLastAttendance = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
    if (daysSinceLastAttendance > 14) return 0; // Streak broken if more than 2 weeks

    for (let i = sortedRecords.length - 1; i >= 0; i--) {
      const recordDate = new Date(sortedRecords[i].date);
      const weekDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24 * 7));

      if (weekDiff <= 1) {
        streak++;
        currentDate = recordDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateLongestStreak = (sortedRecords) => {
    if (sortedRecords.length === 0) return 0;

    let maxStreak = 1;
    let currentStreak = 1;
    let lastDate = new Date(sortedRecords[0].date);

    for (let i = 1; i < sortedRecords.length; i++) {
      const currentDate = new Date(sortedRecords[i].date);
      const weekDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24 * 7));

      if (weekDiff <= 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }

      lastDate = currentDate;
    }

    return maxStreak;
  };

  const checkPerfectMonth = (records, sessions) => {
    // Check if attended all sessions in any month
    const monthGroups = {};
    
    sessions.forEach(session => {
      if (!session?.date) return;
      const monthKey = session.date.substring(0, 7); // YYYY-MM
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = { total: 0, attended: 0 };
      }
      monthGroups[monthKey].total++;
      
      if (records.some(r => r.sessionId === session.id)) {
        monthGroups[monthKey].attended++;
      }
    });

    return Object.values(monthGroups).some(month => 
      month.total > 0 && month.attended === month.total && month.total >= 4
    );
  };

  const checkPerfectQuarter = (records, sessions) => {
    // Simplified: Check if attended all sessions in any 3-month period
    return false; // Implement if needed
  };

  const checkPerfectYear = (records, sessions) => {
    // Check if attended all sessions in any year
    const yearGroups = {};
    
    sessions.forEach(session => {
      if (!session?.date) return;
      const year = session.date.substring(0, 4);
      if (!yearGroups[year]) {
        yearGroups[year] = { total: 0, attended: 0 };
      }
      yearGroups[year].total++;
      
      if (records.some(r => r.sessionId === session.id)) {
        yearGroups[year].attended++;
      }
    });

    return Object.values(yearGroups).some(year => 
      year.total > 0 && year.attended === year.total && year.total >= 40
    );
  };

  const calculateEarnedBadges = (stats) => {
    const earned = [];

    // Attendance badges
    if (stats.totalAttendance >= 1) earned.push('newcomer');
    if (stats.totalAttendance >= 5) earned.push('regular');
    if (stats.totalAttendance >= 10) earned.push('committed');
    if (stats.totalAttendance >= 25) earned.push('dedicated');
    if (stats.totalAttendance >= 50) earned.push('faithful');
    if (stats.totalAttendance >= 100) earned.push('champion');

    // Streak badges
    if (stats.longestStreak >= 3) earned.push('streak_3');
    if (stats.longestStreak >= 5) earned.push('streak_5');
    if (stats.longestStreak >= 10) earned.push('streak_10');

    // Perfect attendance badges
    if (stats.perfectMonth) earned.push('perfect_month');
    if (stats.perfectQuarter) earned.push('perfect_quarter');
    if (stats.perfectYear) earned.push('perfect_year');

    return earned;
  };

  const awardBadges = async (stats) => {
    // Save badge achievements to Firestore
    for (const stat of stats) {
      if (stat.earnedBadges.length > 0) {
        try {
          await setDoc(doc(db, 'achievements', stat.member.memberId), {
            memberId: stat.member.memberId,
            memberName: stat.member.fullName,
            badges: stat.earnedBadges,
            totalAttendance: stat.totalAttendance,
            currentStreak: stat.currentStreak,
            longestStreak: stat.longestStreak,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving achievements:', error);
        }
      }
    }
  };

  const getBadgeInfo = (badgeId) => {
    return badges.find(b => b.id === badgeId);
  };

  const getTopPerformers = () => {
    return [...memberStats]
      .sort((a, b) => b.totalAttendance - a.totalAttendance)
      .slice(0, 10);
  };

  const getStreakLeaders = () => {
    return [...memberStats]
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .filter(s => s.currentStreak > 0)
      .slice(0, 10);
  };

  const getMilestoneMembers = () => {
    const milestones = [100, 50, 25, 10, 5];
    const result = [];
    const seen = new Set();

    milestones.forEach(milestone => {
      memberStats
        .filter(s => s.totalAttendance >= milestone)
        .forEach(stat => {
          const memberKey = stat.member.memberId || stat.member.id;
          if (seen.has(memberKey)) return;
          seen.add(memberKey);
          result.push({ ...stat, milestone });
        });
    });

    return result;
  };

  const loading = membersLoading || sessionsLoading || recordsLoading;

  const topPerformers = useMemo(() => getTopPerformers(), [memberStats]);
  const streakLeaders = useMemo(() => getStreakLeaders(), [memberStats]);
  const milestoneMembers = useMemo(() => getMilestoneMembers(), [memberStats]);

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
      <div className="card bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏆 Achievements & Recognition</h1>
            <p className="opacity-90">Celebrating consistent attendance and dedication</p>
          </div>
          <div className="hidden md:block">
            <Trophy className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setView('badges')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            view === 'badges'
              ? 'bg-church-gold text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Award className="w-5 h-5 inline mr-2" />
          Badges
        </button>
        <button
          onClick={() => setView('leaderboard')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            view === 'leaderboard'
              ? 'bg-church-gold text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Trophy className="w-5 h-5 inline mr-2" />
          Leaderboard
        </button>
        <button
          onClick={() => setView('milestones')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            view === 'milestones'
              ? 'bg-church-gold text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Gift className="w-5 h-5 inline mr-2" />
          Milestones
        </button>
      </div>

      {/* Badges View */}
      {view === 'badges' && (
        <div className="space-y-6">
          {/* Badge Categories */}
          {['attendance', 'streak', 'perfect', 'special'].map(category => {
            const categoryBadges = badges.filter(b => b.category === category);
            const categoryName = {
              attendance: 'Attendance Badges',
              streak: 'Streak Badges',
              perfect: 'Perfect Attendance',
              special: 'Special Achievements'
            }[category];

            return (
              <div key={category} className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{categoryName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryBadges.map(badge => {
                    const Icon = badge.icon;
                    const earnedCount = memberStats.filter(s => 
                      s.earnedBadges.includes(badge.id)
                    ).length;

                    return (
                      <div
                        key={badge.id}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`${badge.color} p-3 rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{badge.name}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{earnedCount} members earned</span>
                          <Medal className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard View */}
      {view === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Attendance */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span>Top Attendance</span>
            </h2>
            <div className="space-y-3">
              {topPerformers.map((stat, index) => (
                <div
                  key={stat.member.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200' :
                    index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                    index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{stat.member.fullName}</p>
                      <p className="text-sm text-gray-600">{stat.badgeCount} badges earned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stat.totalAttendance}</p>
                    <p className="text-xs text-gray-600">services</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Streaks */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Flame className="w-6 h-6 text-red-500" />
              <span>Current Streaks</span>
            </h2>
            <div className="space-y-3">
              {streakLeaders.map((stat, index) => (
                <div
                  key={stat.member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg font-bold text-red-800">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{stat.member.fullName}</p>
                      <p className="text-sm text-gray-600">Longest: {stat.longestStreak} weeks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Flame className="w-6 h-6 text-red-500" />
                    <span className="text-2xl font-bold text-red-600">{stat.currentStreak}</span>
                  </div>
                </div>
              ))}
              {streakLeaders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active streaks yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Milestones View */}
      {view === 'milestones' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Gift className="w-6 h-6 text-purple-500" />
            <span>Recent Milestones</span>
          </h2>
          
          {milestoneMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No recent milestones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestoneMembers.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{stat.member.fullName}</p>
                      <p className="text-sm text-gray-600">Reached {stat.milestone} services milestone! 🎉</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">{stat.milestone}</p>
                    <p className="text-xs text-gray-600">services</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Achievements;
