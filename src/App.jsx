import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './component/AuthProvider';
import { CountriesProvider } from './component/CountriesApi';
import { SocketProvider } from './component/SocketProvider';
import ForceLogoutHandler from './component/ForceLogoutHandler';
import Login from './pages/Student/Login';
import Signup from './pages/Student/Signup';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminSignup from './pages/Admin/AdminSignup';
import StudentDashboard from './pages/Student/StudentDashboard';
import CreateProfile from './pages/Student/CreateProfile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import StudentManagement from './pages/Admin/StudentManagement';
import ProtectedRoute from './component/ProtectedRoute';
import CompletedSessions from './pages/Admin/CompletedSessions';
import UpcomingSessions from './pages/Admin/UpcomingSessions';
import ExpiredSessions from './pages/Admin/ExpiredSessions';

const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        isAuthenticated ? 
          <Navigate to={role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace /> : 
          <Login />
      } />
      <Route path="/signup" element={
        isAuthenticated ? 
          <Navigate to={role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace /> : 
          <Signup />
      } />
      <Route path="/admin-login" element={
        isAuthenticated ? 
          <Navigate to={role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace /> : 
          <AdminLogin />
      } />
      <Route path="/admin-signup" element={
        isAuthenticated ? 
          <Navigate to={role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace /> : 
          <AdminSignup />
      } />

      {/* Protected Routes */}
      <Route path="/student-dashboard" element={
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/create-profile" element={
        <ProtectedRoute requiredRole="student">
          <CreateProfile />
        </ProtectedRoute>
      } />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student-management" element={
        <ProtectedRoute requiredRole="admin">
          <StudentManagement />
        </ProtectedRoute>
      } />
      <Route path="/completed-sessions" element={<ProtectedRoute><CompletedSessions /></ProtectedRoute>} />
      <Route path="/upcoming-sessions" element={<ProtectedRoute><UpcomingSessions /></ProtectedRoute>} />
      <Route path="/expired-sessions" element={<ProtectedRoute><ExpiredSessions /></ProtectedRoute>} />

      {/* Catch all route */}
      <Route path="*" element={
        <Navigate to="/" replace />
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <CountriesProvider>
            <ForceLogoutHandler />
            <AppRoutes />
          </CountriesProvider>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default App;