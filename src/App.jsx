import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import { offlineStorage } from './utils/offlineStorage';
import Login from './pages/Login';
import EnhancedDashboard from './pages/EnhancedDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import MyPortal from './pages/MyPortal';
import Members from './pages/Members';
import EnhancedMemberProfile from './pages/EnhancedMemberProfile';
import MemberImport from './pages/MemberImport';
import Visitors from './pages/Visitors';
import VisitorProfile from './pages/VisitorProfile';
import EventCalendar from './pages/EventCalendar';
import Celebrations from './pages/Celebrations';
import Achievements from './pages/Achievements';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import Contributions from './pages/Contributions';
import FinancialReports from './pages/FinancialReports';
import BackupManager from './pages/BackupManager';
import PhotoGallery from './pages/PhotoGallery';
import Settings from './pages/Settings';
import UserRoles from './pages/UserRoles';
import Unauthorized from './pages/Unauthorized';

// Routes accessible by viewers
const viewerAllowedRoutes = [
  '/',
  '/my-portal',
  '/events',
  '/gallery',
  '/members',
  '/department-dashboard'
];

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { currentUser, isViewer, isAdmin } = useAuth();
  const location = useLocation();
  const isViewerRoute = viewerAllowedRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admins have full access to everything
  if (isAdmin) {
    return children;
  }

  // Block viewers from accessing restricted routes
  if (isViewer && !isViewerRoute) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Additional role-based access control if needed
  if (requiredRole) {
    const hasRequiredRole = requiredRole === 'admin' ? isAdmin : 
                         requiredRole === 'leader' ? currentUser.isLeader : true;
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Routes accessible by all authenticated users */}
          <Route index element={<EnhancedDashboard />} />
          <Route path="my-portal" element={<MyPortal />} />
          <Route path="events" element={<EventCalendar />} />
          <Route path="gallery" element={<PhotoGallery />} />
          
          {/* Members list - viewable by all authenticated users */}
          <Route path="members" element={<Members />} />
          {/* Member profile and import - restricted */}
          <Route path="members/import" element={
            <PrivateRoute requiredRole="leader">
              <MemberImport />
            </PrivateRoute>
          } />
          <Route path="members/:memberId" element={
            <PrivateRoute requiredRole="leader">
              <EnhancedMemberProfile />
            </PrivateRoute>
          } />
          
          {/* Department Dashboard - Accessible to all authenticated users */}
          <Route path="department-dashboard" element={<DepartmentDashboard />} />
          <Route path="visitors" element={
            <PrivateRoute requiredRole="leader">
              <Visitors />
            </PrivateRoute>
          } />
          <Route path="visitors/:visitorId" element={
            <PrivateRoute requiredRole="leader">
              <VisitorProfile />
            </PrivateRoute>
          } />
          <Route path="celebrations" element={
            <PrivateRoute requiredRole="leader">
              <Celebrations />
            </PrivateRoute>
          } />
          <Route path="achievements" element={
            <PrivateRoute requiredRole="leader">
              <Achievements />
            </PrivateRoute>
          } />
          <Route path="attendance" element={
            <PrivateRoute requiredRole="leader">
              <Attendance />
            </PrivateRoute>
          } />
          <Route path="reports" element={
            <PrivateRoute requiredRole="leader">
              <Reports />
            </PrivateRoute>
          } />
          <Route path="analytics" element={
            <PrivateRoute requiredRole="leader">
              <AdvancedAnalytics />
            </PrivateRoute>
          } />
          <Route path="contributions" element={
            <PrivateRoute requiredRole="leader">
              <Contributions />
            </PrivateRoute>
          } />
          <Route path="financial-reports" element={
            <PrivateRoute requiredRole="leader">
              <FinancialReports />
            </PrivateRoute>
          } />
          <Route path="backup" element={
            <PrivateRoute requiredRole="admin">
              <BackupManager />
            </PrivateRoute>
          } />
          <Route path="user-roles" element={
            <PrivateRoute requiredRole="admin">
              <UserRoles />
            </PrivateRoute>
          } />
          <Route path="settings" element={
            <PrivateRoute requiredRole="admin">
              <Settings />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Initialize offline storage
    offlineStorage.init().catch((error) => {
      console.error('Failed to initialize offline storage:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
      <OfflineIndicator />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#D4AF37',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
