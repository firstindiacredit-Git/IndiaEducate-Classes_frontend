import React from 'react'
import './App.css'

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

// student routes
import Signup from './pages/Student/Signup'
import Login from './pages/Student/Login'
import StudentDashboard from './pages/Student/StudentDashboard'

// admin routes
import AdminSignup from './pages/Admin/AdminSignup'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'

import { useAuth } from './component/AuthProvider';

const StudentProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  // Only allow access to student dashboard
  if (location.pathname.startsWith('/student-dashboard')) {
    return children;
  }
  // If authenticated but trying to access admin dashboard, redirect to student dashboard
  return <Navigate to="/student-dashboard" replace />;
};

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }
  // Only allow access to admin dashboard
  if (location.pathname.startsWith('/admin-dashboard')) {
    return children;
  }
  // If authenticated but trying to access student dashboard, redirect to admin dashboard
  return <Navigate to="/admin-dashboard" replace />;
};

const StudentPublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/student-dashboard" replace />;
  }
  return children;
};

const AdminPublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated && location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin-dashboard" replace />;
  }
  return children;
};

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Student Routes */}
          <Route path='/signup' element={<StudentPublicRoute><Signup /></StudentPublicRoute>}></Route>
          <Route path='/' element={<StudentPublicRoute><Login /></StudentPublicRoute>}></Route>
          <Route path='/student-dashboard' element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>}></Route>

          
          {/* Admin Routes */}
          <Route path='/admin-signup' element={<AdminPublicRoute><AdminSignup /></AdminPublicRoute>}></Route>
          <Route path='/admin-login' element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>}></Route>
          <Route path='/admin-dashboard' element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>}></Route>

          
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App