import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [role, setRole] = useState(() => {
    return localStorage.getItem('role') || null;
  });
  
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  // Persist authentication state
  useEffect(() => {
    if (isAuthenticated && role) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('role');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('adminEmailOrPhone');
      localStorage.removeItem('studentEmailOrPhone');
    }
  }, [isAuthenticated, role]);

  // Persist profile state
  useEffect(() => {
    if (profile) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('userProfile');
    }
  }, [profile]);



  const login = async (userRole, emailOrPhone) => {
    // Prevent login as other role if already logged in
    const currentRole = localStorage.getItem('role');
    if (isAuthenticated && currentRole && currentRole !== userRole) {
      message.error(`Please logout from the current account (${currentRole}) before logging in as ${userRole}.`);
      return false;
    }

    try {
      // Save email/phone based on role
      if (userRole === 'admin') {
        localStorage.setItem('adminEmailOrPhone', emailOrPhone);
      } else if (userRole === 'student') {
        localStorage.setItem('studentEmailOrPhone', emailOrPhone);
      }

      // Fetch initial profile data
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/${userRole}/profile`,
        { emailOrPhone }
      );

      if (res.data) {
        setProfile(res.data);
      }

      setIsAuthenticated(true);
      setRole(userRole);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setProfile(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('adminEmailOrPhone');
    localStorage.removeItem('studentEmailOrPhone');
    message.success('Logout successful!');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      role, 
      login, 
      logout, 
      profile, 
      setProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 