import React, { useEffect } from 'react';
import { useSocket } from './SocketProvider';
import { useAuth } from './AuthProvider';
import { message } from 'antd';

const ForceLogoutHandler = () => {
  const { socket, joinForceLogout, leaveForceLogout } = useSocket();
  const { role, profile, logout } = useAuth();

  // Handle force logout for students
  useEffect(() => {
    if (socket && role === 'student' && profile?.email) {
      // Join force-logout room for this student
      joinForceLogout(profile.email);

      // Listen for force logout event
      const handleForceLogout = (data) => {
        console.log('Received force-logout event:', data);
        message.error(data.message || 'Your account has been deleted. You have been logged out.');
        logout();
      };

      socket.on('force-logout', handleForceLogout);

      // Cleanup
      return () => {
        socket.off('force-logout', handleForceLogout);
        leaveForceLogout(profile.email);
      };
    }
  }, [socket, role, profile?.email, joinForceLogout, leaveForceLogout, logout]);

  // Handle cleanup when user logs out
  useEffect(() => {
    if (socket && role === 'student' && profile?.email) {
      // This effect will run when the component unmounts or when profile/role changes
      return () => {
        if (profile?.email) {
          leaveForceLogout(profile.email);
        }
      };
    }
  }, [socket, role, profile?.email, leaveForceLogout]);

  return null; // This component doesn't render anything
};

export default ForceLogoutHandler; 