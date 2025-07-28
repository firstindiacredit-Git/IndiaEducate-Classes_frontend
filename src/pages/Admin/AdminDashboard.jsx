import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const AdminDashboard = () => {
  const { profile } = useAuth();

  return (
    <div style={{ minHeight: '100vh'}}>
      <AdminNavbar />
      
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
        <Title level={2} style={{ marginBottom: 24 }}>Dashboard Overview</Title>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Students"
                value={156}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Courses"
                value={8}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed Sessions"
                value={48}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Upcoming Sessions"
                value={12}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="Recent Activities" style={{ height: '100%' }}>
              <p>No recent activities to display.</p>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Quick Actions" style={{ height: '100%' }}>
              <p>No quick actions available.</p>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AdminDashboard;