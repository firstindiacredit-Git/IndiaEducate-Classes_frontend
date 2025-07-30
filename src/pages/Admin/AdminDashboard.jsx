import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, message, Button, Modal, Form, Input, DatePicker, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import moment from 'moment';
import {
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

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
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [form] = Form.useForm();
  const [completedSessions, setCompletedSessions] = useState([]);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [expiredSessions, setExpiredSessions] = useState([]);
  const [expiredSessionsCount, setExpiredSessionsCount] = useState(0);
  const [selectedExpiredSession, setSelectedExpiredSession] = useState(null);
  const [activeClass, setActiveClass] = useState(null);


  // Function to check if a class should be expired or completed
  const checkClassStatus = (classData) => {
    const now = new Date();
    const startTime = new Date(classData.startTime);
    const endTime = new Date(startTime.getTime() + (classData.duration * 60000));

    if (now > endTime) {
      return classData.status === 'ongoing' ? 'completed' : 'expired';
    }
    return classData.status;
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/dashboard-stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      message.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch upcoming classes with status check
  const fetchUpcomingClasses = async () => {
    try {
      console.log('Fetching upcoming classes...');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/upcoming/all`);
      
      // Check if any active class has ended
      if (activeClass) {
        const status = checkClassStatus(activeClass);
        if (status === 'completed') {
          setJitsiModalVisible(false);
          setActiveClass(null);
          message.info('Class has ended due to duration completion');
        }
      }

      setUpcomingClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      message.error('Failed to fetch upcoming classes');
    }
  };

  // Fetch completed sessions
  const fetchCompletedSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/completed-sessions`);
      setCompletedSessions(response.data.sessions);
      setCompletedSessionsCount(response.data.totalCompleted);
      setStats(prev => ({
        ...prev,
        completedSessions: response.data.totalCompleted
      }));
    } catch (err) {
      console.error('Error fetching completed sessions:', err);
      message.error('Failed to fetch completed sessions');
    }
  };

  // Fetch expired sessions
  const fetchExpiredSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/expired-sessions`);
      console.log('Expired sessions:', response.data);
      setExpiredSessions(response.data.sessions);
      setExpiredSessionsCount(response.data.totalExpired);
    } catch (err) {
      console.error('Error fetching expired sessions:', err);
      message.error('Failed to fetch expired sessions');
    }
  };

  // Initial data fetch and polling
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchUpcomingClasses(),
          fetchExpiredSessions(),
          fetchCompletedSessions(),
        ]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };

    fetchData();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);


  // Handle class scheduling
  const handleScheduleClass = async (values) => {
    try {
      if (!profile?._id) {
        message.error('Admin ID not found. Please try logging in again.');
        return;
      }

      // Convert duration to number
      const duration = parseInt(values.duration);
      if (isNaN(duration) || duration < 5 || duration > 180) {
        message.error('Duration must be between 5 and 180 minutes');
        return;
      }

      console.log('Scheduling class with values:', values);
      const payload = {
        ...values,
        duration: duration,
        startTime: values.startTime.toISOString(),
        adminId: profile._id
      };
      console.log('Sending payload:', payload);

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/create`, payload);
      console.log('Class scheduled response:', response.data);
      
      message.success('Class scheduled successfully');
      setScheduleModalVisible(false);
      form.resetFields();
      fetchUpcomingClasses();
    } catch (err) {
      console.error('Error scheduling class:', err);
      message.error(err.response?.data?.message || 'Failed to schedule class');
    }
  };



  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Title level={2}>Dashboard Overview</Title>
          <Button 
            type="primary" 
            icon={<VideoCameraOutlined />}
            onClick={() => setScheduleModalVisible(true)}
          >
            Schedule Class
          </Button>
        </Row>
        
        <Row gutter={[24, 24]}>
          {/* Existing stat cards */}
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/student-management')} style={{ cursor: 'pointer' }} loading={loading}>
              <Statistic
                title="Total Students"
                value={stats.totalStudents}
                prefix={<UserOutlined style={{ color: '#3f8600' }} />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>

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

          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              loading={loading}
              onClick={() => navigate('/completed-sessions')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="Completed Sessions"
                value={completedSessionsCount}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              loading={loading}
              onClick={() => navigate('/upcoming-sessions')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="Upcoming Sessions"
                value={upcomingClasses.length}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>

          {/* Add Expired Sessions Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              loading={loading}
              onClick={() => navigate('/expired-sessions')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="Expired Sessions"
                value={expiredSessionsCount}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        
        {/* Schedule Class Modal */}
        <Modal
          title="Schedule New Class"
          open={scheduleModalVisible}
          onCancel={() => {
            setScheduleModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleScheduleClass}
            initialValues={{
              duration: 60,
              program: '24-session'
            }}
          >
            <Form.Item
              name="title"
              label="Class Title"
              rules={[{ required: true, message: 'Please enter class title' }]}
            >
              <Input placeholder="Enter class title" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea placeholder="Enter class description" />
            </Form.Item>

            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[
                { required: true, message: 'Please select start time' },
                {
                  validator: (_, value) => {
                    if (value && value.toDate() < new Date()) {
                      return Promise.reject('Cannot schedule class in the past');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                disabledDate={(current) => current && current < moment().startOf('day')}
                disabledTime={(current) => {
                  if (current && current.isSame(moment(), 'day')) {
                    return {
                      disabledHours: () => Array.from({ length: moment().hour() }, (_, i) => i),
                      disabledMinutes: (hour) => {
                        if (hour === moment().hour()) {
                          return Array.from({ length: moment().minute() }, (_, i) => i);
                        }
                        return [];
                      }
                    };
                  }
                  return {};
                }}
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (minutes)"
              rules={[
                { required: true, message: 'Please enter duration' },
                { 
                  validator: async (_, value) => {
                    const duration = parseInt(value);
                    if (isNaN(duration) || duration < 5 || duration > 180) {
                      throw new Error('Duration must be between 5 and 180 minutes');
                    }
                  }
                }
              ]}
            >
              <Input 
                type="number" 
                min={5} 
                max={180} 
                placeholder="Enter duration in minutes"
              />
            </Form.Item>

            <Form.Item
              name="program"
              label="Program"
              rules={[{ required: true, message: 'Please select program' }]}
            >
              <Select placeholder="Select program">
                <Option value="24-session">24 Session Program</Option>
                <Option value="48-session">48 Session Program</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Schedule Class
              </Button>
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </div>
  );
};

export default AdminDashboard;