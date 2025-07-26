import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('role') || null;
  });
  // Add profile state
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
    if (isAuthenticated && role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }
  }, [isAuthenticated, role]);

  const login = (userRole) => {
    // Prevent login as other role if already logged in
    const currentRole = localStorage.getItem('role');
    if (isAuthenticated && currentRole && currentRole !== userRole) {
      message.error(`Please logout from the current account (${currentRole}) before logging in as ${userRole}.`);
      return false;
    }
    setIsAuthenticated(true);
    setRole(userRole);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setProfile(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
    message.success('Logout successful!');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout, profile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}; 