import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Badge, Avatar, Dropdown, Space, Modal, List, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';
import { useSocket } from '../../component/SocketProvider';
import axios from 'axios';
import moment from 'moment';

// Add CSS for sidebar scrolling
const sidebarStyles = `
  .sidebar-menu-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    border: 1px solid #f1f1f1;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-corner {
    background: #f1f1f1;
  }
  
  /* Firefox scrollbar styles */
  .sidebar-menu-container {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f1f1f1;
  }
`;

// Inject styles
if (!document.getElementById('student-sidebar-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'student-sidebar-styles';
  styleSheet.textContent = sidebarStyles;
  document.head.appendChild(styleSheet);
}

import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  TrophyOutlined,
  MessageOutlined,
  MailOutlined,
  QuestionCircleOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileOutlined,
  FormOutlined,
  BarChartOutlined,
  QuestionCircleOutlined as HelpOutlined,
  IdcardOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

const StudentSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: _logout, profile } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [_fetchingNotifications, setFetchingNotifications] = useState(false);
  
  // Profile modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    navigate(e.key);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setFetchingNotifications(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/notifications`);
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setFetchingNotifications(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/student/notifications/${notificationId}/read`);
      setNotifications(prev => 
        (prev || []).map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, (prev || 0) - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/student/notifications/read-all`);
      setNotifications(prev => (prev || []).map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'class_started') {
      // Handle class join logic
      if (notification.message.includes('http')) {
        window.open(notification.message.split('Click to join: ')[1], '_blank');
      }
    }
    
    setNotificationModalVisible(false);
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'upcoming_class_warning':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'class_expired':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'class_started':
        return <VideoCameraOutlined style={{ color: '#52c41a' }} />;
      default:
        return <BellOutlined />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return moment(timestamp).fromNow();
  };

  // Socket.io event listeners for real-time notifications
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('new-notification', (data) => {
        setNotifications(prev => [data.notification, ...(prev || [])]);
        setUnreadCount(prev => (prev || 0) + 1);
        message.info(data.notification.title);
      });

      socket.on('notification-read', (data) => {
        setUnreadCount(data.unreadCount);
      });

      socket.on('all-notifications-read', () => {
        setUnreadCount(0);
      });
    }

    return () => {
      if (socket) {
        socket.off('new-notification');
        socket.off('notification-read');
        socket.off('all-notifications-read');
      }
    };
  }, [socket, isConnected]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const showNotificationModal = () => {
    setNotificationModalVisible(true);
    if (unreadCount > 0) {
      markAllNotificationsAsRead();
    }
  };

  const showViewModal = () => {
    setViewModalVisible(true);
  };

  const menuItems = [
    {
      key: '/student-dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      type: 'divider'
    },
    {
      key: '/progress-tracking',
      icon: <BarChartOutlined />,
      label: 'Progress Tracking',
    },
    {
      type: 'divider'
    },
    {
      key: '/quiz-dashboard',
      icon: <BookOutlined />,
      label: 'Quiz Dashboard',
    },
    {
      key: '/quiz-history',
      icon: <FileTextOutlined />,
      label: 'Quiz History',
    },
    {
      type: 'divider'
    },
    {
      key: '/assignment-dashboard',
      icon: <VideoCameraOutlined />,
      label: 'Assignment Dashboard',
    },
    {
      key: '/assignment-history',
      icon: <FileTextOutlined />,
      label: 'Assignment History',
    },
    {
      type: 'divider'
    },
    {
      key: '/file-library',
      icon: <FileOutlined />,
      label: 'File Library',
    },
    {
      key: '/certificate',
      icon: <TrophyOutlined />,
      label: 'Certificate',
    },
    {
      type: 'divider'
    },
    {
      type: 'divider'
    },
    {
      key: '/contact-us',
      icon: <MailOutlined />,
      label: 'Contact Us',
    },
    {
      key: '/faq',
      icon: <QuestionCircleOutlined />,
      label: 'FAQ',
    },
    {
      key: '/help-center',
      icon: <HelpOutlined />,
      label: 'Help Center',
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      width={250}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {!collapsed && (
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            Student Portal
          </Title>
        )}
        <div
          style={{
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background-color 0.3s',
          }}
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>

      {/* User Profile Section */}
      {!collapsed && (
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <Space direction="vertical" size="small">
            <Avatar
              size={64}
              src={profile?.profilePicture}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {profile?.fullName || 'Student User'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {profile?.email || 'student@example.com'}
              </div>
              {profile?.program && (
                <div style={{ fontSize: '11px', color: '#1890ff', marginTop: '2px' }}>
                  {profile.program}
                </div>
              )}
            </div>
          </Space>
        </div>
      )}

      {/* Navigation Menu */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        paddingTop: '8px',
        paddingBottom: '30px',
        maxHeight: collapsed ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)', // Adjust height based on collapsed state
        scrollbarWidth: 'thin',
        scrollbarColor: '#d9d9d9 transparent'
      }}
      className="sidebar-menu-container"
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
            width: '100%',
          }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onClick={showViewModal}
          >
            <Avatar size="small" src={profile?.profilePicture} icon={<UserOutlined />} />
            <span style={{ fontSize: '12px' }}>Student</span>
          </div>
        )}
        
        <Badge count={unreadCount} size="small">
          <BellOutlined
            style={{
              fontSize: '16px',
              color: '#666',
              cursor: 'pointer',
            }}
            onClick={showNotificationModal}
          />
        </Badge>
      </div>

      {/* Notification Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button 
                type="link" 
                size="small"
                onClick={markAllNotificationsAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        }
        open={notificationModalVisible}
        onCancel={() => setNotificationModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setNotificationModalVisible(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        {!notifications || notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BellOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <p style={{ color: '#666', margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications || []}
            renderItem={(notification) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  backgroundColor: notification.isRead ? 'transparent' : '#f0f8ff',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  border: notification.isRead ? '1px solid #f0f0f0' : '1px solid #1890ff'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}>
                      <span style={{ 
                        fontWeight: notification.isRead ? 'normal' : 'bold',
                        color: notification.isRead ? '#666' : '#000'
                      }}>
                        {notification.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {formatTimestamp(notification.timestamp || notification.createdAt)}
                      </span>
                    </div>
                  }
                  description={
                    <div style={{ 
                      color: notification.isRead ? '#666' : '#333',
                      marginTop: '4px'
                    }}>
                      {notification.message}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* View Profile Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
            <Title level={4} style={{ margin: 0 }}>Student Profile Details</Title>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={580}
        centered
      >
        <div style={{ display: 'flex', padding: '20px 0' }}>
          {/* Left side - Profile Picture */}
          <div style={{ flex: '0 0 220px', textAlign: 'center' }}>
            {profile?.profilePicture ? (
              <div>
                <img
                  src={profile.profilePicture}
                  alt="Profile Picture"
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '4px solid #f0f0f0'
                  }}
                />
              </div>
            ) : (
              <div>
                <Avatar
                  icon={<UserOutlined />}
                  size={180}
                  style={{
                    backgroundColor: '#f0f0f0',
                    border: '4px solid #e0e0e0'
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <span style={{ 
                    backgroundColor: '#faad14', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    Profile Picture Not Added
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Profile Info */}
          <div style={{ flex: 1, paddingLeft: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                {profile?.fullName || <span style={{ color: '#ff4d4f' }}>Name Not Added</span>}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>
                <span style={{ 
                  backgroundColor: '#52c41a', 
                  color: 'white', 
                  padding: '2px 12px', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Student
                </span>
              </div>
            </div>

            <div style={{
              background: '#fafafa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 14 }}>{profile?.email}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Phone Number</div>
                <div style={{ fontSize: 14 }}>{profile?.phone}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Program</div>
                <div style={{ fontSize: 14 }}>
                  {profile?.program || <span style={{ color: '#ff4d4f' }}>Not Selected</span>}
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Enrollment ID</div>
                <div style={{ fontSize: 14 }}>
                  {profile?.enrollmentId || <span style={{ color: '#ff4d4f' }}>Not Added</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Sider>
  );
};

export default StudentSidebar; 