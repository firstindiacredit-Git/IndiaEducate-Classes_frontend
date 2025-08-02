import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const newSocket = io(import.meta.env.VITE_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      // console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      // console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const joinNotifications = (studentEmail) => {
    if (socket && studentEmail) {
      socket.emit('join-notifications', studentEmail);
      // console.log('Joined notifications room for:', studentEmail);
    }
  };

  const leaveNotifications = (studentEmail) => {
    if (socket && studentEmail) {
      socket.emit('leave-notifications', studentEmail);
      // console.log('Left notifications room for:', studentEmail);
    }
  };

  const joinProfile = (studentEmail) => {
    if (socket && studentEmail) {
      socket.emit('join-profile', studentEmail);
      // console.log('Joined profile room for:', studentEmail);
    }
  };

  const leaveProfile = (studentEmail) => {
    if (socket && studentEmail) {
      socket.emit('leave-profile', studentEmail);
      // console.log('Left profile room for:', studentEmail);
    }
  };

  const value = {
    socket,
    isConnected,
    joinNotifications,
    leaveNotifications,
    joinProfile,
    leaveProfile
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 