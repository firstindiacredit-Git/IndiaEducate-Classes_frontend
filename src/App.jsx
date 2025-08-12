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
import FileUpload from './pages/Admin/FileUpload';
import FileLibrary from './pages/Student/FileLibrary';
import QuizManagement from './pages/Admin/QuizManagement';
import QuizSubmissions from './pages/Admin/QuizSubmissions';
import QuizDashboard from './pages/Student/QuizDashboard';
import TakeQuiz from './pages/Student/TakeQuiz';
import QuizHistory from './pages/Student/QuizHistory';
import QuizResult from './pages/Student/QuizResult';
import AssignmentManagement from './pages/Admin/AssignmentManagement';
import AssignmentSubmissions from './pages/Admin/AssignmentSubmissions';
import AssignmentDashboard from './pages/Student/AssignmentDashboard';
import SubmitAssignment from './pages/Student/SubmitAssignment';
import AssignmentHistory from './pages/Student/AssignmentHistory';
import AssignmentSubmissionDetails from './pages/Student/AssignmentSubmissionDetails';
import ProgressTracking from './pages/Student/ProgressTracking';
import Certificate from './pages/Student/Certificate';
import CertificateManagement from './pages/Admin/CertificateManagement';
import HelpCenter from './pages/Student/HelpCenter';
import ContactUs from './pages/Student/ContactUs';
import FAQ from './pages/Student/FAQ';
import TicketManagement from './pages/Admin/TicketManagement';
import ContactManagement from './pages/Admin/ContactManagement';
import FAQManagement from './pages/Admin/FAQManagement';

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
      <Route path="/file-upload" element={
        <ProtectedRoute requiredRole="admin">
          <FileUpload />
        </ProtectedRoute>
      } />
      <Route path="/file-library" element={
        <ProtectedRoute requiredRole="student">
          <FileLibrary />
        </ProtectedRoute>
      } />
      <Route path="/quiz-management" element={
        <ProtectedRoute requiredRole="admin">
          <QuizManagement />
        </ProtectedRoute>
      } />
      <Route path="/quiz-submissions/:quizId" element={
        <ProtectedRoute requiredRole="admin">
          <QuizSubmissions />
        </ProtectedRoute>
      } />
      <Route path="/quiz-dashboard" element={
        <ProtectedRoute requiredRole="student">
          <QuizDashboard />
        </ProtectedRoute>
      } />
      <Route path="/take-quiz/:quizId" element={
        <ProtectedRoute requiredRole="student">
          <TakeQuiz />
        </ProtectedRoute>
      } />
      <Route path="/quiz-history" element={
        <ProtectedRoute requiredRole="student">
          <QuizHistory />
        </ProtectedRoute>
      } />
      <Route path="/quiz-result/:submissionId" element={
        <ProtectedRoute requiredRole="student">
          <QuizResult />
        </ProtectedRoute>
      } />
      <Route path="/assignment-management" element={
        <ProtectedRoute requiredRole="admin">
          <AssignmentManagement />
        </ProtectedRoute>
      } />
      <Route path="/assignment-submissions/:assignmentId" element={
        <ProtectedRoute requiredRole="admin">
          <AssignmentSubmissions />
        </ProtectedRoute>
      } />
      <Route path="/assignment-dashboard" element={
        <ProtectedRoute requiredRole="student">
          <AssignmentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/submit-assignment/:assignmentId" element={
        <ProtectedRoute requiredRole="student">
          <SubmitAssignment />
        </ProtectedRoute>
      } />
      <Route path="/assignment-history" element={
        <ProtectedRoute requiredRole="student">
          <AssignmentHistory />
        </ProtectedRoute>
      } />
      <Route path="/assignment-submission-details/:submissionId" element={
        <ProtectedRoute requiredRole="student">
          <AssignmentSubmissionDetails />
        </ProtectedRoute>
      } />
      <Route path="/progress-tracking" element={
        <ProtectedRoute requiredRole="student">
          <ProgressTracking />
        </ProtectedRoute>
      } />
      <Route path="/certificate" element={
        <ProtectedRoute requiredRole="student">
          <Certificate />
        </ProtectedRoute>
      } />
      <Route path="/certificate-management" element={
        <ProtectedRoute requiredRole="admin">
          <CertificateManagement />
        </ProtectedRoute>
      } />
              <Route path="/help-center" element={
          <ProtectedRoute requiredRole="student">
            <HelpCenter />
          </ProtectedRoute>
        } />
        <Route path="/contact-us" element={
          <ProtectedRoute requiredRole="student">
            <ContactUs />
          </ProtectedRoute>
        } />
        <Route path="/faq" element={
          <ProtectedRoute requiredRole="student">
            <FAQ />
          </ProtectedRoute>
        } />
        <Route path="/ticket-management" element={
          <ProtectedRoute requiredRole="admin">
            <TicketManagement />
          </ProtectedRoute>
        } />
        <Route path="/contact-management" element={
          <ProtectedRoute requiredRole="admin">
            <ContactManagement />
          </ProtectedRoute>
        } />
        <Route path="/faq-management" element={
          <ProtectedRoute requiredRole="admin">
            <FAQManagement />
          </ProtectedRoute>
        } />

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
