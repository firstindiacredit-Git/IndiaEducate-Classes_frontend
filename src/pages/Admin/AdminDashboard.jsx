import React from 'react';
import { Typography, Card, Button } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <Title level={2}>Welcome to Admin Dashboard</Title>
      <Paragraph>You are successfully logged in as admin!</Paragraph>
      <Button type="primary" danger onClick={handleLogout} style={{ marginTop: 24 }}>
        Logout
      </Button>
    </Card>
  );
};

export default AdminDashboard;