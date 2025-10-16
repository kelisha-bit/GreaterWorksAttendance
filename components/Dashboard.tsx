
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Member, AttendanceSession, AttendanceRecord, UserRole } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { ChartBarIcon, ClipboardListIcon, PlusIcon, UsersIcon } from './icons';

interface DashboardProps {
  members: Member[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  setActiveView: (view: string) => void;
  currentRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ members, sessions, records, setActiveView, currentRole }) => {
  const lastSession = sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  let lastSessionPresent = 0;
  let lastSessionTotal = members.length;

  if(lastSession){
    const lastSessionRecords = records.filter(r => r.sessionId === lastSession.id);
    lastSessionPresent = lastSessionRecords.filter(r => r.present).length;
    // If session is for a department, total is members of that department
    if(lastSession.department){
        lastSessionTotal = members.filter(m => m.department === lastSession.department).length;
    }
  }

  const attendancePercentage = lastSessionTotal > 0 ? ((lastSessionPresent / lastSessionTotal) * 100).toFixed(0) : 0;

  const chartData = sessions
    .filter(s => s.eventType === 'Sunday Service')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(session => {
        const presentCount = records.filter(r => r.sessionId === session.id && r.present).length;
        return {
            date: new Date(session.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
            Present: presentCount
        };
    });

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gw-dark">Dashboard</h1>
        <p className="text-gray-500">Welcome to the Greater Works City Church Attendance Tracker.</p>
      </header>
      
      {/* Quick Actions */}
      {currentRole === UserRole.Admin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => setActiveView('attendance')} icon={<PlusIcon className="h-5 w-5"/>}>Add Session</Button>
            <Button onClick={() => setActiveView('members')} icon={<UsersIcon className="h-5 w-5"/>}>Register Member</Button>
            <Button onClick={() => setActiveView('reports')} icon={<ChartBarIcon className="h-5 w-5"/>}>View Reports</Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-500">Total Members</h3>
          <p className="text-4xl font-bold text-gw-gold">{members.length}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-500">Last Service Attendance</h3>
          <p className="text-4xl font-bold text-gw-gold">{lastSessionPresent}</p>
          <p className="text-gray-500">out of {lastSessionTotal}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-500">Attendance Rate</h3>
          <p className="text-4xl font-bold text-gw-gold">{attendancePercentage}%</p>
          <p className="text-gray-500">{lastSession?.name || 'N/A'}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-500">Total Sessions</h3>
          <p className="text-4xl font-bold text-gw-gold">{sessions.length}</p>
        </Card>
      </div>

      {/* Attendance Trend Chart */}
      <Card>
        <h3 className="text-xl font-bold text-gw-dark mb-4">Sunday Service Attendance Trend</h3>
        <div className="w-full h-72">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false}/>
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" fill="#B8860B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
