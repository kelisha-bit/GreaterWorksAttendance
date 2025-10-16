import React, { useState, useEffect } from 'react';
import { mockMembers, mockRecords, mockSessions } from './data/mockData';
import { Member, AttendanceSession, AttendanceRecord, User } from './types';
import Dashboard from './components/Dashboard';
import MemberManagement from './components/MemberManagement';
import AttendanceTracking from './components/AttendanceTracking';
import Reports from './components/Reports';
import MemberProfile from './components/MemberProfile';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import { ChartBarIcon, ClipboardListIcon, HomeIcon, UsersIcon, LogoutIcon } from './components/icons';

type View = 'dashboard' | 'members' | 'attendance' | 'reports' | 'profile';

const NavItem: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive 
            ? 'bg-gw-gold text-white shadow-md' 
            : 'text-gray-600 hover:bg-yellow-50 hover:text-gw-dark'
        }`}
    >
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

const App: React.FC = () => {
  const { user, loading, error, signInWithEmail, signInWithGoogle, signOut } = useAuth();
  
  // App's local data state
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [sessions, setSessions] = useState<AttendanceSession[]>(mockSessions);
  const [records, setRecords] = useState<AttendanceRecord[]>(mockRecords);
  
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (activeView === 'profile' && !selectedMember) {
      setActiveView('members');
    }
  }, [activeView, selectedMember]);

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setActiveView('profile');
  };

  const handleBackToList = () => {
    setSelectedMember(null);
    setActiveView('members');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gw-dark">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onEmailLogin={signInWithEmail} onGoogleLogin={signInWithGoogle} error={error} />;
  }
  
  const currentRole = user.role;

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return <Dashboard members={members} sessions={sessions} records={records} setActiveView={setActiveView as (view: string) => void} currentRole={currentRole} />;
      case 'members':
        return <MemberManagement members={members} setMembers={setMembers} currentRole={currentRole} onViewMember={handleViewMember} />;
      case 'attendance':
        return <AttendanceTracking members={members} sessions={sessions} records={records} setSessions={setSessions} setRecords={setRecords} currentRole={currentRole} />;
      case 'reports':
        return <Reports members={members} sessions={sessions} records={records} currentRole={currentRole} />;
      case 'profile':
        if (selectedMember) {
          return <MemberProfile member={selectedMember} sessions={sessions} records={records} onBack={handleBackToList} />;
        }
        return null;
      default:
        return <Dashboard members={members} sessions={sessions} records={records} setActiveView={setActiveView as (view: string) => void} currentRole={currentRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 flex flex-col p-4">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 bg-gw-gold rounded-full"></div>
                <h1 className="text-xl font-bold text-gw-dark">GWCC Tracker</h1>
            </div>
            <nav className="flex flex-col space-y-2">
                <NavItem 
                    label="Dashboard" 
                    icon={<HomeIcon className="h-6 w-6"/>}
                    isActive={activeView === 'dashboard'} 
                    onClick={() => setActiveView('dashboard')}
                />
                 <NavItem 
                    label="Members" 
                    icon={<UsersIcon className="h-6 w-6"/>}
                    isActive={activeView === 'members' || activeView === 'profile'} 
                    onClick={() => setActiveView('members')}
                />
                 {/* Fix: Completed the NavItem for Attendance, which was truncated. */}
                 <NavItem 
                    label="Attendance" 
                    icon={<ClipboardListIcon className="h-6 w-6"/>}
                    isActive={activeView === 'attendance'}
                    onClick={() => setActiveView('attendance')}
                />
                 <NavItem 
                    label="Reports" 
                    icon={<ChartBarIcon className="h-6 w-6"/>}
                    isActive={activeView === 'reports'} 
                    onClick={() => setActiveView('reports')}
                />
            </nav>
            <div className="mt-auto">
                 <NavItem 
                    label="Logout" 
                    icon={<LogoutIcon className="h-6 w-6"/>}
                    isActive={false} 
                    onClick={signOut}
                />
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Fix: Added the missing default export to resolve the import error in index.tsx.
export default App;
