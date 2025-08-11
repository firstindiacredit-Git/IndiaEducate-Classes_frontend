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
    width: 6px;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }
  
  .sidebar-menu-container::-webkit-scrollbar-thumb:hover {
    background: #bfbfbf;
  }
`;

// Inject styles
if (!document.getElementById('sidebar-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'sidebar-styles';
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
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedKey, setSelectedKey] = useState(location.pathname);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  
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
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/notifications`);
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
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/admin/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/admin/notifications/read-all`);
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
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
    if (notification.type === 'upcoming_class_warning' || notification.type === 'class_expired') {
      navigate('/upcoming-sessions');
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
      socket.on('admin-new-notification', (data) => {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        message.info(data.notification.title);
      });

      socket.on('admin-notification-read', (data) => {
        setUnreadCount(data.unreadCount);
      });

      socket.on('admin-all-notifications-read', () => {
        setUnreadCount(0);
      });
    }

    return () => {
      if (socket) {
        socket.off('admin-new-notification');
        socket.off('admin-notification-read');
        socket.off('admin-all-notifications-read');
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
      key: '/admin-dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      type: 'divider'
    },
    {
      key: '/student-management',
      icon: <UserOutlined />,
      label: 'Student Management',
    },
    {
      key: '/upcoming-sessions',
      icon: <ClockCircleOutlined />,
      label: 'Upcoming Sessions',
    },
    {
      key: '/completed-sessions',
      icon: <CheckCircleOutlined />,
      label: 'Completed Sessions',
    },
    {
      key: '/expired-sessions',
      icon: <WarningOutlined />,
      label: 'Expired Sessions',
    },
    {
      type: 'divider'
    },
    {
      key: '/file-upload',
      icon: <UploadOutlined />,
      label: 'File Management',
    },
    {
      key: '/quiz-management',
      icon: <BookOutlined />,
      label: 'Quiz Management',
    },
    {
      key: '/assignment-management',
      icon: <VideoCameraOutlined />,
      label: 'Assignment Management',
    },
    {
      key: '/certificate-management',
      icon: <TrophyOutlined />,
      label: 'Certificate Management',
    },
    {
      type: 'divider'
    },
    {
      key: '/ticket-management',
      icon: <MessageOutlined />,
      label: 'Ticket Management',
    },
    {
      key: '/contact-management',
      icon: <MailOutlined />,
      label: 'Contact Management',
    },
    {
      key: '/faq-management',
      icon: <QuestionCircleOutlined />,
      label: 'FAQ Management',
    },
    {
      type: 'divider'
    },
    {
      key: '/quiz-submissions',
      icon: <FileTextOutlined />,
      label: 'Quiz Submissions',
    },
    {
      key: '/assignment-submissions',
      icon: <FileTextOutlined />,
      label: 'Assignment Submissions',
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
            Admin Panel
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
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {profile?.name || 'Admin User'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {profile?.email || 'admin@example.com'}
              </div>
            </div>
          </Space>
        </div>
      )}

      {/* Navigation Menu */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        paddingTop: '8px',
        maxHeight: 'calc(100vh - 200px)', // Reserve space for header and footer
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
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ fontSize: '12px' }}>Admin</span>
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
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <BellOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <p style={{ color: '#666', margin: 0 }}>No notifications yet</p>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
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
              <Title level={4} style={{ margin: 0 }}>Admin Profile Details</Title>
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
                    backgroundColor: '#1890ff', 
                    color: 'white', 
                    padding: '2px 12px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    Administrator
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
                <div>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Phone Number</div>
                  <div style={{ fontSize: 14 }}>{profile?.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </Sider>
    );
  };

export default AdminSidebar;
