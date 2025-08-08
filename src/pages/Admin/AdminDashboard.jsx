import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, message, Button, Modal, Form, Input, DatePicker, Select, Alert } from 'antd';
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
  TeamOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  TrophyOutlined,
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
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Monitor active connections and detect issues
  const [activeConnections, setActiveConnections] = useState(0);
  const [connectionIssues, setConnectionIssues] = useState([]);

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
      // console.log('Fetching upcoming classes...');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/upcoming/all`);
      
      // Check if any active class has ended
      if (activeClass) {
        const status = checkClassStatus(activeClass);
        if (status === 'completed') {
          // setJitsiModalVisible(false); // This state is not defined in the original file
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
      // console.log('Expired sessions:', response.data);
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
    // const interval = setInterval(fetchData, 30000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkActiveConnections = async () => {
      try {
        // Get all ongoing classes
        const ongoingClasses = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/ongoing`);
        
        let totalConnections = 0;
        const issues = [];

        for (const classData of ongoingClasses.data) {
          // Get attendance for this class
          const attendance = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/attendance/class/${classData._id}`);
          const activeStudents = attendance.data.attendance.filter(a => a.status === 'partial').length;
          totalConnections += activeStudents;

          // Check for potential issues
          if (activeStudents > 50) {
            issues.push({
              classId: classData._id,
              className: classData.title,
              activeStudents,
              issue: 'High number of active students - potential performance issues'
            });
          }

          // Check for students who joined but haven't left (potential crash victims)
          const stuckStudents = attendance.data.attendance.filter(a => 
            a.status === 'partial' && 
            !a.leaveTime && 
            new Date() - new Date(a.joinTime) > 30 * 60 * 1000 // More than 30 minutes
          );

          if (stuckStudents.length > 0) {
            issues.push({
              classId: classData._id,
              className: classData.title,
              stuckStudents: stuckStudents.length,
              issue: 'Students may have crashed or lost connection'
            });
          }
        }

        setActiveConnections(totalConnections);
        setConnectionIssues(issues);
      } catch (err) {
        console.error('Error checking active connections:', err);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkActiveConnections, 30000);
    checkActiveConnections(); // Initial check

    return () => clearInterval(interval);
  }, []);


  // Handle class scheduling
  const handleScheduleClass = async (values) => {
    try {
      setScheduleLoading(true);
      
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

      // console.log('Scheduling class with values:', values);
      const payload = {
        ...values,
        duration: duration,
        startTime: values.startTime.toISOString(),
        adminId: profile._id
      };
      // console.log('Sending payload:', payload);

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/create`, payload);
      // console.log('Class scheduled response:', response.data);
      
      message.success('Class scheduled successfully');
      setScheduleModalVisible(false);
      form.resetFields();
      fetchUpcomingClasses();
    } catch (err) {
      console.error('Error scheduling class:', err);
      message.error(err.response?.data?.message || 'Failed to schedule class');
    } finally {
      setScheduleLoading(false);
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

          {/* Active Connections Monitoring */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                borderColor: activeConnections > 50 ? '#ff4d4f' : activeConnections > 30 ? '#faad14' : '#52c41a',
                borderWidth: '2px'
              }}
            >
              <Statistic
                title="Active Connections"
                value={activeConnections}
                prefix={<TeamOutlined style={{ 
                  color: activeConnections > 50 ? '#ff4d4f' : activeConnections > 30 ? '#faad14' : '#52c41a' 
                }} />}
                valueStyle={{ 
                  color: activeConnections > 50 ? '#ff4d4f' : activeConnections > 30 ? '#faad14' : '#52c41a' 
                }}
                suffix={activeConnections > 50 ? '⚠️' : activeConnections > 30 ? '⚡' : ''}
              />
            </Card>
          </Col>

          {/* File Upload Management */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              onClick={() => navigate('/file-upload')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="File Management"
                value="Upload & Manage"
                prefix={<UploadOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '14px' }}
              />
            </Card>
          </Col>

          {/* Quiz Management */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              onClick={() => navigate('/quiz-management')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="Quiz Management"
                value="Create & Manage"
                prefix={<BookOutlined style={{ color: '#13c2c2' }} />}
                valueStyle={{ color: '#13c2c2', fontSize: '14px' }}
              />
            </Card>
          </Col>

          {/* Assignment Management */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              onClick={() => navigate('/assignment-management')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="Assignment Management"
                value="Speaking Tasks"
                prefix={<VideoCameraOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '14px' }}
              />
            </Card>
          </Col>

          {/* Certificate Management */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable
              onClick={() => navigate('/certificate-management')}
              style={{ cursor: 'pointer' }}
            >
              <Statistic
                title="Certificate Management"
                value="Approve & Manage"
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontSize: '14px' }}
              />
            </Card>
          </Col>

          {/* Connection Issues */}
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                borderColor: connectionIssues.length > 0 ? '#ff4d4f' : '#52c41a',
                borderWidth: '2px'
              }}
            >
              <Statistic
                title="Connection Issues"
                value={connectionIssues.length}
                prefix={<ExclamationCircleOutlined style={{ 
                  color: connectionIssues.length > 0 ? '#ff4d4f' : '#52c41a' 
                }} />}
                valueStyle={{ 
                  color: connectionIssues.length > 0 ? '#ff4d4f' : '#52c41a' 
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Connection Issues Alert */}
        {connectionIssues.length > 0 && (
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Alert
                message="Connection Issues Detected"
                description={
                  <div>
                    {connectionIssues.map((issue, index) => (
                      <div key={index} style={{ marginBottom: 8 }}>
                        <strong>{issue.className}:</strong> {issue.issue}
                        {issue.activeStudents && ` (${issue.activeStudents} students)`}
                        {issue.stuckStudents && ` (${issue.stuckStudents} stuck students)`}
                      </div>
                    ))}
                  </div>
                }
                type="warning"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            </Col>
          </Row>
        )}
        
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
              <Button type="primary" htmlType="submit" block loading={scheduleLoading}>
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