import React from 'react';
import { Typography, Card, Button } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const StudentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <Title level={2}>Welcome to Student Dashboard</Title>
      <Paragraph>You are successfully logged in!</Paragraph>
      <Button type="primary" danger onClick={handleLogout} style={{ marginTop: 24 }}>
        Logout
      </Button>
    </Card>
  );
};

export default StudentDashboard;