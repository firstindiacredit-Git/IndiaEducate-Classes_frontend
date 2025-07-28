import React from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// student routes
import Signup from './pages/Student/Signup'
import Login from './pages/Student/Login'
import StudentDashboard from './pages/Student/StudentDashboard'
import CreateProfile from './pages/Student/CreateProfile'

// admin routes
import AdminSignup from './pages/Admin/AdminSignup'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'

import { useAuth } from './component/AuthProvider';
import ProtectedRoute from './component/ProtectedRoute';

const App = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <BrowserRouter>
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

        {/* Catch all route */}
        <Route path="*" element={
          <Navigate to="/" replace />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App