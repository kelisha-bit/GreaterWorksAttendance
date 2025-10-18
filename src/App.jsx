import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import EnhancedDashboard from './pages/EnhancedDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import MyPortal from './pages/MyPortal';
import Members from './pages/Members';
import EnhancedMemberProfile from './pages/EnhancedMemberProfile';
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

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<EnhancedDashboard />} />
          <Route path="department-dashboard" element={<DepartmentDashboard />} />
          <Route path="my-portal" element={<MyPortal />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:memberId" element={<EnhancedMemberProfile />} />
          <Route path="visitors" element={<Visitors />} />
          <Route path="visitors/:visitorId" element={<VisitorProfile />} />
          <Route path="events" element={<EventCalendar />} />
          <Route path="celebrations" element={<Celebrations />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="analytics" element={<AdvancedAnalytics />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="financial-reports" element={<FinancialReports />} />
          <Route path="backup" element={<BackupManager />} />
          <Route path="gallery" element={<PhotoGallery />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
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
