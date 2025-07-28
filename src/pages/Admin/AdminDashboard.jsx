import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    completedSessions: 0,
    upcomingSessions: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/dashboard-stats`);
        setStats(response.data);
      } catch (err) {
        message.error('Failed to fetch dashboard statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
        <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>Dashboard Overview</Title>
        
        <Row gutter={[24, 24]}>
          {/* Total Students Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/student-management')}
              style={{ cursor: 'pointer' }}
              loading={loading}
            >
              <Statistic
                title="Total Students"
                value={stats.totalStudents}
                prefix={<UserOutlined style={{ color: '#3f8600' }} />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>

          {/* Active Courses Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="Active Courses"
                value={stats.activeCourses}
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          {/* Completed Sessions Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="Completed Sessions"
                value={stats.completedSessions}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          {/* Upcoming Sessions Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="Upcoming Sessions"
                value={stats.upcomingSessions}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {/* Recent Activities */}
          <Col xs={24} lg={16}>
            <Card title="Recent Activities" style={{ height: '100%' }}>
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                No recent activities to display.
              </div>
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={24} lg={8}>
            <Card title="Quick Actions" style={{ height: '100%' }}>
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                No quick actions available.
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AdminDashboard;