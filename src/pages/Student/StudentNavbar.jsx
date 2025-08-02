import React, { useEffect, useState } from 'react';
import { Typography, Button, Avatar, Dropdown, Menu, Row, Col, Modal, Form, Input, Select, Upload, message, Tag, Image, Badge, List, Divider } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useSocket } from '../../component/SocketProvider';
import { useNavigate } from 'react-router-dom';
import { useCountries } from '../../component/CountriesApi';
import {
    UserOutlined,
    UploadOutlined,
    EyeOutlined,
    EditOutlined,
    LogoutOutlined,
    BellOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    VideoCameraOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const StudentNavbar = () => {
    const { logout, profile, setProfile } = useAuth();
    const { socket, isConnected, joinNotifications, leaveNotifications, joinProfile, leaveProfile } = useSocket();
    const navigate = useNavigate();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const { countries, loading: countriesLoading, renderCountryLabel } = useCountries();

    // Fetch profile if not loaded
    useEffect(() => {
        const fetchProfile = async () => {
            if (!profile) {
                const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
                if (!emailOrPhone) return;
                try {
                    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/profile`, { emailOrPhone });
                    setProfile(res.data);
                } catch (err) {
                    // handle error
                }
            }
        };
        fetchProfile();
    }, [profile, setProfile]);

    // Periodic profile refresh (every 30 seconds) as fallback
    useEffect(() => {
        const interval = setInterval(async () => {
            if (profile?.email) {
                try {
                    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/profile`, { 
                        emailOrPhone: profile.email 
                    });
                    // Only update if there are actual changes
                    if (JSON.stringify(res.data) !== JSON.stringify(profile)) {
                        setProfile(res.data);
                    }
                } catch (err) {
                    // Silently handle error for periodic refresh
                }
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [profile?.email, setProfile]);

    // Socket.io real-time notification and profile handling
    useEffect(() => {
        if (socket && profile?.email) {
            // Join notifications room for this student
            joinNotifications(profile.email);
            
            // Join profile room for this student
            joinProfile(profile.email);

            // Listen for new notifications
            socket.on('new-notification', (data) => {
                // console.log('Received new notification:', data);
                setNotifications(prev => [data.notification, ...prev]);
                setNotificationCount(prev => prev + data.unreadCount);
                
                // Show a toast notification
                message.info(`New notification: ${data.notification.title}`);
            });

            // Listen for notification read updates
            socket.on('notification-read', (data) => {
                setNotificationCount(data.unreadCount);
                setNotifications(prev => 
                    prev.map(notification => 
                        notification._id === data.notificationId 
                            ? { ...notification, isRead: true }
                            : notification
                    )
                );
            });

            // Listen for all notifications read
            socket.on('all-notifications-read', (data) => {
                setNotificationCount(data.unreadCount);
                setNotifications(prev => 
                    prev.map(notification => ({ ...notification, isRead: true }))
                );
            });

            // Listen for notification deleted
            socket.on('notification-deleted', (data) => {
                setNotificationCount(data.unreadCount);
                setNotifications(prev => 
                    prev.filter(notification => notification._id !== data.notificationId)
                );
            });

            // Listen for profile updates from admin
            socket.on('profile-updated', (data) => {
                // console.log('Profile updated by admin:', data);
                if (data.profile) {
                    setProfile(data.profile);
                    message.success('Your profile has been updated by admin');
                }
            });

            // Cleanup listeners on unmount or email change
            return () => {
                socket.off('new-notification');
                socket.off('notification-read');
                socket.off('all-notifications-read');
                socket.off('notification-deleted');
                socket.off('profile-updated');
                leaveNotifications(profile.email);
                leaveProfile(profile.email);
            };
        }
    }, [socket, profile?.email, joinNotifications, leaveNotifications, joinProfile, leaveProfile, setProfile]);

    // Fetch notifications on component mount
    const fetchNotifications = async () => {
        if (!profile?.email) return;
        
        setLoadingNotifications(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/notifications/${profile.email}`);
            setNotifications(response.data.notifications || []);
            setNotificationCount(response.data.unreadCount || 0);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            // If endpoint doesn't exist yet, create mock notifications
            const mockNotifications = [
                {
                    id: 1,
                    type: 'class_scheduled',
                    title: 'New Class Scheduled',
                    message: 'Mathematics Class has been scheduled for tomorrow at 10:00 AM',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    isRead: false
                },
                {
                    id: 2,
                    type: 'class_updated',
                    title: 'Class Updated',
                    message: 'Science Class time has been changed to 2:00 PM',
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                    isRead: true
                },
                {
                    id: 3,
                    type: 'class_cancelled',
                    title: 'Class Cancelled',
                    message: 'English Class scheduled for today has been cancelled',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                    isRead: false
                }
            ];
            setNotifications(mockNotifications);
            setNotificationCount(mockNotifications.filter(n => !n.isRead).length);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [profile?.email]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleRefreshProfile = async () => {
        if (!profile?.email) return;
        try {
            const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/profile`, { 
                emailOrPhone: profile.email 
            });
            setProfile(res.data);
            message.success('Profile refreshed successfully');
        } catch (err) {
            message.error('Failed to refresh profile');
        }
    };

    const showEditModal = () => {
        form.setFieldsValue({
            fullName: profile?.fullName,
            email: profile?.email,
            phone: profile?.phone,
            country: profile?.country,
            enrollmentId: profile?.enrollmentId,
            program: profile?.program,
        });
        setEditModalVisible(true);
    };

    const showViewModal = () => {
        setViewModalVisible(true);
    };

    const showNotificationModal = async () => {
        setNotificationModalVisible(true);
        
        // Mark all notifications as read when modal opens
        if (profile?.email && notificationCount > 0) {
            try {
                await axios.put(`${import.meta.env.VITE_BASE_URL}/api/notifications/${profile.email}/read-all`);
                setNotificationCount(0);
            } catch (err) {
                console.error('Error marking notifications as read:', err);
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'class_scheduled':
                return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
            case 'class_updated':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'class_cancelled':
                return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'class_started':
                return <VideoCameraOutlined style={{ color: '#ff6b35' }} />;
            default:
                return <BellOutlined style={{ color: '#666' }} />;
        }
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Function to format notification time with timezone
    const formatNotificationTime = (notification) => {
        // If notification has timezone metadata, use it
        if (notification.metadata && notification.metadata.timezone) {
            return notification.metadata.localStartTime || formatTimestamp(notification.timestamp || notification.createdAt);
        }
        return formatTimestamp(notification.timestamp || notification.createdAt);
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }

        const isLessThan5MB = file.size <= MAX_FILE_SIZE;
        if (!isLessThan5MB) {
            message.error('Image must be smaller than 5MB! Please choose a smaller file.');
            return false;
        }

        return true;
    };

    const handleEditProfile = async (values) => {
        setLoading(true);
        try {
            const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
            const formData = new FormData();

            // Add file if exists
            if (fileList.length > 0) {
                formData.append('profilePicture', fileList[0].originFileObj);
            }

            // Add other form data
            formData.append('emailOrPhone', emailOrPhone);
            formData.append('fullName', values.fullName);
            formData.append('country', values.country);
            formData.append('enrollmentId', values.enrollmentId);
            formData.append('program', values.program);

            const res = await axios.put(
                `${import.meta.env.VITE_BASE_URL}/api/student/profile`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            setProfile(res.data.profile);
            message.success('Profile updated successfully!');
            setEditModalVisible(false);
            form.resetFields();
            setFileList([]);
        } catch (err) {
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const menu = (
        <Menu>
            <Menu.Item key="view" onClick={showViewModal} icon={<EyeOutlined />}>
                View Profile
            </Menu.Item>
            {/* <Menu.Item key="refresh" onClick={handleRefreshProfile} icon={<ReloadOutlined />}>
                Refresh Profile
            </Menu.Item> */}
            {/* <Menu.Item key="edit" onClick={showEditModal} icon={<EditOutlined />}>
                Edit Profile
            </Menu.Item> */}
            <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
                Logout
            </Menu.Item>
        </Menu>
    );

    const firstName = profile?.fullName?.split(' ')[0] || 'Student';
    const avatarSrc = profile?.profilePicture || null;

    return (
        <div style={{ 
            width: '100%', 
            backgroundColor: '#fff', 
            // boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <Row 
                justify="space-between" 
                align="middle" 
                style={{ 
                    padding: '12px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    width: '100%'
                }}
            >
                <Col>
                    <Title level={4} style={{ margin: 0 }}>India Educates</Title>
                </Col>
                <Col>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Notification Bell with Socket.io Status */}
                        <Badge count={notificationCount} size="small" offset={[-5, 5]}>
                            <Button
                                type="text"
                                icon={<BellOutlined style={{ fontSize: '18px' }} />}
                                onClick={showNotificationModal}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    boxShadow: 'none',
                                    position: 'relative'
                                }}
                            />
                        </Badge>
                        
                        {/* Socket Connection Status Indicator */}
                        {/* <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: isConnected ? '#52c41a' : '#ff4d4f',
                            marginLeft: '-8px',
                            marginTop: '-8px'
                        }} /> */}
                        
                        {/* Profile Dropdown */}
                        <Dropdown overlay={menu} placement="bottomRight">
                            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Avatar src={avatarSrc} icon={!avatarSrc && <UserOutlined />} style={{ marginRight: 8 }} />
                                <span style={{ color: '#333' }}>{firstName}</span>
                            </span>
                        </Dropdown>
                    </div>
                </Col>
            </Row>

            {/* Notification Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BellOutlined />
                        <span>Notifications</span>
                        {notificationCount > 0 && (
                            <Badge count={notificationCount} size="small" />
                        )}
                        {!isConnected && (
                            <Tag color="warning" size="small">Offline</Tag>
                        )}
                    </div>
                }
                open={notificationModalVisible}
                onCancel={() => setNotificationModalVisible(false)}
                footer={null}
                width={500}
                centered
            >
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loadingNotifications ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div>Loading notifications...</div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <BellOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                            <div>No notifications yet</div>
                            <div style={{ fontSize: '12px', marginTop: '8px' }}>
                                You'll see notifications here when classes are scheduled or updated
                            </div>
                        </div>
                    ) : (
                        <List
                            dataSource={notifications}
                            renderItem={(notification) => (
                                <List.Item
                                    style={{
                                        padding: '12px 0',
                                        borderBottom: '1px solid #f0f0f0',
                                        backgroundColor: notification.isRead ? 'transparent' : '#f6ffed'
                                    }}
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
                                                    {formatNotificationTime(notification)}
                                                </span>
                                            </div>
                                        }
                                        description={
                                            <div style={{ 
                                                color: notification.isRead ? '#666' : '#333',
                                                marginTop: '4px'
                                            }}>
                                                {notification.type === 'class_started' && notification.message.includes('http') ? (
                                                    <div>
                                                        <div style={{ marginBottom: '8px' }}>
                                                            {notification.message.split('Click to join:')[0]}
                                                        </div>
                                                        <Button 
                                                            type="primary" 
                                                            size="small"
                                                            icon={<VideoCameraOutlined />}
                                                            onClick={() => window.open(notification.message.split('Click to join: ')[1], '_blank')}
                                                        >
                                                            Join Class Now
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    notification.message
                                                )}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            </Modal>

            {/* View Profile Modal */}
            <Modal
                title={
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                        <Title level={4} style={{ margin: 0 }}>Profile Details</Title>
                    </div>
                }
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={[
                    <Button 
                        type="default" 
                        icon={<ReloadOutlined />} 
                        // style={{ float: 'right', marginLeft: 8 }}
                        onClick={handleRefreshProfile}
                    >
                        Refresh Profile
                    </Button>,
                    <Button key="edit" type="primary" onClick={() => {
                        setViewModalVisible(false);
                        showEditModal();
                    }} icon={<EditOutlined />}>
                        Edit Profile
                    </Button>,
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
                                <Image
                                    src={profile.profilePicture}
                                    alt="Profile Picture"
                                    style={{
                                        width: 180,
                                        height: 180,
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        border: '4px solid #f0f0f0'
                                    }}
                                    preview={{
                                        maskClassName: 'customize-mask',
                                        mask: <div style={{ color: 'white', fontSize: '14px' }}>
                                            Click to view
                                            <br />
                                            (Zoom, Rotate & More)
                                        </div>
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
                                    <Tag color="warning">Profile Picture Not Added</Tag>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side - Profile Info */}
                    <div style={{ flex: 1, paddingLeft: 20 }}>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                                {profile?.fullName || <Tag color="error">Name Not Added</Tag>}
                            </div>
                            <div style={{ color: '#666', fontSize: 14 }}>
                                {profile?.program ? (
                                    <Tag color="blue" style={{ padding: '2px 12px' }}>{profile.program}</Tag>
                                ) : (
                                    <Tag color="error">Program Not Selected</Tag>
                                )}
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
                                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Country/Region</div>
                                <div style={{ fontSize: 14 }}>
                                    {profile?.country ? (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {countries.find(c => c.name.common === profile.country) && (
                                                <img
                                                    src={countries.find(c => c.name.common === profile.country).flags.png}
                                                    alt={profile.country}
                                                    style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
                                                />
                                            )}
                                            {profile.country}
                                        </div>
                                    ) : (
                                        <Tag color="error">Not Added</Tag>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Enrollment ID</div>
                                <div style={{ fontSize: 14 }}>
                                    {profile?.enrollmentId || <Tag color="error">Not Added</Tag>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Existing Edit Modal */}
            <Modal
                title="Edit Profile"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    form.resetFields();
                    setFileList([]);
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleEditProfile}
                >
                    <Form.Item
                        label="Profile Picture"
                        extra="Max file size: 5MB. Supported formats: JPG, PNG, GIF"
                    >
                        <Upload
                            beforeUpload={beforeUpload}
                            fileList={fileList}
                            onChange={({ fileList, file }) => {
                                // Only update fileList if file passes validation
                                if (file.status !== 'error') {
                                    setFileList(fileList);
                                }
                            }}
                            maxCount={1}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadOutlined />}>Change Picture</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: 'Full name required' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone Number">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        name="country"
                        label="Country/Region"
                        rules={[{ required: true, message: 'Country required' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Search and select your country"
                            optionFilterProp="children"
                            loading={countriesLoading}
                            filterOption={(input, option) => {
                                const countryName = option?.label?.props?.children[1];
                                return countryName?.toLowerCase().includes(input.toLowerCase());
                            }}
                        >
                            {countries.map((country) => (
                                <Option
                                    key={country.name.common}
                                    value={country.name.common}
                                    label={renderCountryLabel(country)}
                                >
                                    {renderCountryLabel(country)}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="enrollmentId"
                        label="Enrollment Id"
                    // rules={[{ required: true, message: 'Enrollment Id required' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="program"
                        label="Program Enrolled"
                        rules={[{ required: true, message: 'Program required' }]}
                    >
                        <Select>
                            <Option value="24-session">24-session</Option>
                            <Option value="48-session">48-session</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default StudentNavbar