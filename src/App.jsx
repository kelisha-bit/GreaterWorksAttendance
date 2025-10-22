import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import { offlineStorage } from './utils/offlineStorage';
const Login = lazy(() => import('./pages/Login'));
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'));
const DepartmentDashboard = lazy(() => import('./pages/DepartmentDashboard'));
const MyPortal = lazy(() => import('./pages/MyPortal'));
const Members = lazy(() => import('./pages/Members'));
const EnhancedMemberProfile = lazy(() => import('./pages/EnhancedMemberProfile'));
const MemberImport = lazy(() => import('./pages/MemberImport'));
const Visitors = lazy(() => import('./pages/Visitors'));
const VisitorProfile = lazy(() => import('./pages/VisitorProfile'));
const EventCalendar = lazy(() => import('./pages/EventCalendar'));
const Celebrations = lazy(() => import('./pages/Celebrations'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Reports = lazy(() => import('./pages/Reports'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const Contributions = lazy(() => import('./pages/Contributions'));
const FinancialReports = lazy(() => import('./pages/FinancialReports'));
const BackupManager = lazy(() => import('./pages/BackupManager'));
const PhotoGallery = lazy(() => import('./pages/PhotoGallery'));
const Settings = lazy(() => import('./pages/Settings'));
const UserRoles = lazy(() => import('./pages/UserRoles'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
// Ministry Components
const MinistryDashboard = lazy(() => import('./pages/MinistryDashboard'));
const MinistryManagement = lazy(() => import('./pages/MinistryManagement'));

// Routes accessible by viewers
const viewerAllowedRoutes = [
  '/', // Dashboard
  '/my-portal',
  '/events',
  '/gallery',
  '/members',
  '/department-dashboard',
  '/ministries'
];

function AppRoutes() {
  const PrivateRoute = ({ children, requiredRole = null }) => {
    const { currentUser, isViewer, isAdmin, isLeader } = useAuth();
    const location = useLocation();
    const isViewerRoute = viewerAllowedRoutes.some(route => {
      if (location.pathname === route) return true;
      // allow nested paths only when they match a full segment boundary
      return location.pathname.startsWith(route + '/');
    });

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
                           requiredRole === 'leader' ? isLeader : true;
      if (!hasRequiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    return children;
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Suspense fallback={<div />}> <Login /> </Suspense>} />
        <Route path="/unauthorized" element={<Suspense fallback={<div />}> <Unauthorized /> </Suspense>} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Routes accessible by all authenticated users */}
          <Route index element={<Suspense fallback={<div />}> <EnhancedDashboard /> </Suspense>} />
          <Route path="my-portal" element={<Suspense fallback={<div />}> <MyPortal /> </Suspense>} />
          <Route path="events" element={<Suspense fallback={<div />}> <EventCalendar /> </Suspense>} />
          <Route path="gallery" element={<Suspense fallback={<div />}> <PhotoGallery /> </Suspense>} />
          
          {/* Ministry routes */}
          <Route path="ministries">
            <Route index element={
              <Suspense fallback={<div>Loading...</div>}>
                <MinistryDashboard />
              </Suspense>
            } />
            <Route path="manage" element={
              <PrivateRoute requiredRole="admin">
                <Suspense fallback={<div>Loading...</div>}>
                  <MinistryManagement />
                </Suspense>
              </PrivateRoute>
            } />
            <Route path="manage/:ministryId" element={
              <PrivateRoute requiredRole="admin">
                <Suspense fallback={<div>Loading...</div>}>
                  <MinistryManagement />
                </Suspense>
              </PrivateRoute>
            } />
          </Route>
          <Route 
            path="ministry-management" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <MinistryManagement />
              </Suspense>
            } 
          />
          <Route path="ministries" element={<Suspense fallback={<div />}> <MinistryDashboard /> </Suspense>} />
          <Route path="ministries/manage" element={
            <PrivateRoute requiredRole="admin">
              <Suspense fallback={<div />}> <MinistryManagement /> </Suspense>
            </PrivateRoute>
          } />
          
          {/* Redirect /ministry to /ministries */}
          <Route path="ministry" element={<Navigate to="/ministries" replace />} />
          
          {/* Members list - viewable by all authenticated users */}
          <Route path="members" element={<Suspense fallback={<div />}> <Members /> </Suspense>} />
          {/* Member profile and import - restricted */}
          <Route path="members/import" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <MemberImport /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="members/:memberId" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <EnhancedMemberProfile /> </Suspense>
            </PrivateRoute>
          } />
          
          {/* Department Dashboard - Accessible to all authenticated users */}
          <Route path="department-dashboard" element={<Suspense fallback={<div />}> <DepartmentDashboard /> </Suspense>} />
          <Route path="visitors" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <Visitors /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="visitors/:visitorId" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <VisitorProfile /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="celebrations" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <Celebrations /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="achievements" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <Achievements /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="attendance" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <Attendance /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="reports" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <Reports /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="analytics" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <AdvancedAnalytics /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="contributions" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <Contributions /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="financial-reports" element={
            <PrivateRoute requiredRole="leader">
              <Suspense fallback={<div />}> <FinancialReports /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="backup" element={
            <PrivateRoute requiredRole="admin">
              <Suspense fallback={<div />}> <BackupManager /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="user-roles" element={
            <PrivateRoute requiredRole="admin">
              <Suspense fallback={<div />}> <UserRoles /> </Suspense>
            </PrivateRoute>
          } />
          <Route path="settings" element={
            <PrivateRoute requiredRole="admin">
              <Suspense fallback={<div />}> <Settings /> </Suspense>
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  useEffect(() => {
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
        containerStyle={{
          zIndex: 9999
        }}
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
