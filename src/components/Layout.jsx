import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Church,
  UserCircle,
  Wallet,
  TrendingUp,
  UserPlus,
  Briefcase,
  Cake,
  Trophy,
  HardDrive,
  Image,
  Calendar,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, currentUser, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Portal', href: '/my-portal', icon: UserCircle },
    { name: 'My Department', href: '/department-dashboard', icon: Briefcase },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Visitors', href: '/visitors', icon: UserPlus, leaderOnly: true },
    { name: 'Events Calendar', href: '/events', icon: Calendar },
    { name: 'Celebrations', href: '/celebrations', icon: Cake },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
    { name: 'Photo Gallery', href: '/gallery', icon: Image },
    { name: 'Attendance', href: '/attendance', icon: ClipboardCheck },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Advanced Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Contributions', href: '/contributions', icon: Wallet, leaderOnly: true },
    { name: 'Financial Reports', href: '/financial-reports', icon: TrendingUp, leaderOnly: true },
    { name: 'Backup & Data', href: '/backup', icon: HardDrive, adminOnly: true },
    { name: 'User Roles', href: '/user-roles', icon: Shield, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-church-gold p-2 rounded-lg">
                <Church className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Greater Works</h1>
                <p className="text-xs text-gray-500">Attendance Tracker</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              // Hide leader-only items from non-leaders
              if (item.leaderOnly && userRole !== 'admin' && userRole !== 'leader') {
                return null;
              }
              
              // Hide admin-only items from non-admins
              if (item.adminOnly && userRole !== 'admin') {
                return null;
              }
              
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-church-lightGold text-church-darkGold font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-semibold text-gray-900">
                Greater Works City Church, Ghana
              </h2>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
