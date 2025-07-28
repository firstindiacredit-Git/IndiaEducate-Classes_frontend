import React, { useEffect, useState } from 'react';
import { Typography, Button, Avatar, Dropdown, Menu, Row, Col, Modal, Form, Input, Select, Upload, message, Tag, Image, Spin } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import {
    UserOutlined,
    UploadOutlined,
    EyeOutlined,
    EditOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const AdminNavbar = () => {
    const { logout, profile, setProfile } = useAuth();
    const navigate = useNavigate();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const [fileList, setFileList] = useState([]);

    // Fetch profile data
    const fetchProfileData = async () => {
        const emailOrPhone = localStorage.getItem('adminEmailOrPhone');
        if (!emailOrPhone) {
            console.log('No emailOrPhone found in localStorage');
            return;
        }
        
        setFetchingProfile(true);
        try {
            console.log('Fetching profile for:', emailOrPhone);
            const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/profile`, { emailOrPhone });
            console.log('Profile API response:', res.data);
            
            if (res.data) {
                setProfile(res.data);
                form.setFieldsValue({
                    fullName: res.data.fullName || '',
                    email: res.data.email || '',
                    phone: res.data.phone || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            message.error('Failed to load profile data');
        } finally {
            setFetchingProfile(false);
        }
    };

    // Fetch profile on mount and when profile is null
    useEffect(() => {
        if (!profile) {
            fetchProfileData();
        }
    }, []);

    const showEditModal = () => {
        // Ensure we have latest profile data
        if (!profile) {
            fetchProfileData();
        }
        
        // Set form values from current profile
        const currentProfile = profile || {};
        form.setFieldsValue({
            fullName: currentProfile.fullName || '',
            email: currentProfile.email || '',
            phone: currentProfile.phone || ''
        });
        
        setEditModalVisible(true);
    };

    const showViewModal = () => {
        setViewModalVisible(true);
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
            const emailOrPhone = localStorage.getItem('adminEmailOrPhone');
            const formData = new FormData();

            // Add file if exists
            if (fileList.length > 0) {
                formData.append('profilePicture', fileList[0].originFileObj);
            }

            // Add other form data
            formData.append('emailOrPhone', emailOrPhone);
            formData.append('fullName', values.fullName);

            const res = await axios.put(
                `${import.meta.env.VITE_BASE_URL}/api/admin/profile`,
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

    const handleLogout = () => {
        logout();
        navigate('/admin-login');
    };

    const menu = (
        <Menu>
            <Menu.Item key="view" onClick={showViewModal} icon={<EyeOutlined />}>
                View Profile
            </Menu.Item>
            {/* <Menu.Item key="edit" onClick={showEditModal} icon={<EditOutlined />}>
                Edit Profile
            </Menu.Item> */}
            <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
                Logout
            </Menu.Item>
        </Menu>
    );

    const firstName = profile?.fullName?.split(' ')[0] || 'Admin';
    const avatarSrc = profile?.profilePicture || null;

    return (
        <div style={{ 
            width: '100%', 
            backgroundColor: '#fff', 
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
                    {fetchingProfile ? (
                        <Spin size="small" />
                    ) : (
                        <Dropdown overlay={menu} placement="bottomRight">
                            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Avatar src={avatarSrc} icon={!avatarSrc && <UserOutlined />} style={{ marginRight: 8 }} />
                                <span style={{ color: '#333' }}>{firstName}</span>
                            </span>
                        </Dropdown>
                    )}
                </Col>
            </Row>

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
                                <Tag color="blue" style={{ padding: '2px 12px' }}>Administrator</Tag>
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

            {/* Edit Profile Modal */}
            <Modal
                title="Edit Admin Profile"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    const currentProfile = profile || {};
                    form.setFieldsValue({
                        fullName: currentProfile.fullName || '',
                        email: currentProfile.email || '',
                        phone: currentProfile.phone || ''
                    });
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
                    <Form.Item 
                        name="email" 
                        label="Email"
                    >
                        <Input 
                            disabled 
                            style={{ backgroundColor: '#f5f5f5', color: '#333' }} 
                            value={profile?.email || ''}
                        />
                    </Form.Item>
                    <Form.Item 
                        name="phone" 
                        label="Phone Number"
                    >
                        <Input 
                            disabled 
                            style={{ backgroundColor: '#f5f5f5', color: '#333' }} 
                            value={profile?.phone || ''}
                        />
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

export default AdminNavbar
