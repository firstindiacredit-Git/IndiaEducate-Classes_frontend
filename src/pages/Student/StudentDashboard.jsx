import React, { useEffect } from 'react';
import { Typography, Card, Button, Avatar, Dropdown, Menu, Row, Col } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph } = Typography;

const StudentDashboard = () => {
  const { logout, profile, setProfile } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menu = (
    <Menu>
      <Menu.Item key="logout" onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const firstName = profile?.fullName?.split(' ')[0] || 'Student';
  const avatarSrc = profile?.profilePicture || null;

  return (
    <div>
      <Row justify="end" align="middle" style={{ padding: 16 }}>
        <Dropdown overlay={menu} placement="bottomRight">
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Avatar src={avatarSrc} icon={!avatarSrc && <UserOutlined />} style={{ marginRight: 8 }} />
            <span>{firstName}</span>
          </span>
        </Dropdown>
      </Row>
      <Card style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
        <Title level={2}>Welcome, {firstName}</Title>
        <Paragraph>You are successfully logged in!</Paragraph>
      </Card>
    </div>
  );
};

export default StudentDashboard;