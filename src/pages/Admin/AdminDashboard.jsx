import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, message, Button, Modal, Form, Input, DatePicker, Select, Table, Tag, Space, Descriptions, Divider, Alert, Tabs } from 'antd';
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
  EditOutlined,
  HistoryOutlined,
  WarningOutlined,
  SyncOutlined,
  TeamOutlined,
  CloseCircleOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import JitsiMeeting from '../../component/JitsiMeeting';

const { Title, Text } = Typography;
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editForm] = Form.useForm();
  const [completedSessionsModalVisible, setCompletedSessionsModalVisible] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [selectedCompletedSession, setSelectedCompletedSession] = useState(null);
  const [sessionDetailModalVisible, setSessionDetailModalVisible] = useState(false);
  const [upcomingSessionsModalVisible, setUpcomingSessionsModalVisible] = useState(false);
  const [selectedUpcomingSession, setSelectedUpcomingSession] = useState(null);
  const [upcomingSessionDetailModalVisible, setUpcomingSessionDetailModalVisible] = useState(false);
  const [expiredSessionsModalVisible, setExpiredSessionsModalVisible] = useState(false);
  const [expiredSessions, setExpiredSessions] = useState([]);
  const [expiredSessionsCount, setExpiredSessionsCount] = useState(0);
  const [selectedExpiredSession, setSelectedExpiredSession] = useState(null);
  const [expiredSessionDetailModalVisible, setExpiredSessionDetailModalVisible] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  const [jitsiModalVisible, setJitsiModalVisible] = useState(false);

  // Function to format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} minutes` : ''}`;
  };

  // Function to show session details
  const showSessionDetails = (session) => {
    setSelectedCompletedSession(session);
    setSessionDetailModalVisible(true);
  };

  // Function to show upcoming session details
  const showUpcomingSessionDetails = (session) => {
    setSelectedUpcomingSession(session);
    setUpcomingSessionDetailModalVisible(true);
  };

  // Show expired session details
  const showExpiredSessionDetails = (session) => {
    setSelectedExpiredSession(session);
    setExpiredSessionDetailModalVisible(true);
  };

  // Function to manually check for expired classes
  const checkExpiredClasses = async () => {
    try {
      message.loading('Checking for expired classes...', 1);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/check-expired`);
      
      // Refresh all data
      await Promise.all([
        fetchUpcomingClasses(),
        fetchExpiredSessions(),
        fetchCompletedSessions()
      ]);

      message.success(`${response.data.message}`);
    } catch (err) {
      console.error('Error checking expired classes:', err);
      message.error('Failed to check expired classes');
    }
  };

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

  // Fetch attendance summary
  const fetchAttendanceSummary = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/attendance/summary`);
      setAttendanceSummary(response.data);
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
      message.error('Failed to fetch attendance summary');
    }
  };

  // Show class attendance details
  const showAttendanceDetails = async (classId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/attendance/class/${classId}`);
      setSelectedClassAttendance(response.data);
      setAttendanceModalVisible(true);
    } catch (err) {
      console.error('Error fetching class attendance:', err);
      message.error('Failed to fetch class attendance');
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
          fetchAttendanceSummary()
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

  // Start class meeting
  const handleStartClass = async (classId) => {
    try {
      console.log('Starting class:', classId);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/start/${classId}`);
      const { meetingLink } = response.data.schedule;
      setActiveClass(response.data.schedule);
      setJitsiModalVisible(true);
      fetchUpcomingClasses(); // Refresh the list
      message.success('Class started successfully');
    } catch (err) {
      console.error('Error starting class:', err);
      message.error('Failed to start class');
    }
  };

  // End class meeting
  const handleEndClass = async (classId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/end/${classId}`);
      message.success('Class ended successfully');
      setJitsiModalVisible(false);
      setActiveClass(null);
      // Refresh all data
      await Promise.all([
        fetchUpcomingClasses(),
        fetchCompletedSessions(),
        fetchExpiredSessions()
      ]);
    } catch (err) {
      console.error('Error ending class:', err);
      message.error('Failed to end class');
    }
  };

  // Join ongoing class
  const handleJoinClass = (classData) => {
    setActiveClass(classData);
    setJitsiModalVisible(true);
  };

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

  // Handle edit class
  const handleEditClass = async (values) => {
    try {
      if (!selectedClass?._id) {
        message.error('No class selected for editing');
        return;
      }

      // Convert duration to number
      const duration = parseInt(values.duration);
      if (isNaN(duration) || duration < 5 || duration > 180) {
        message.error('Duration must be between 5 and 180 minutes');
        return;
      }

      // Validate that the start time is in the future
      const startTime = values.startTime.toDate();
      if (startTime < new Date()) {
        message.error('Cannot schedule class in the past');
        return;
      }

      console.log('Editing class with values:', values);
      const payload = {
        ...values,
        duration: duration,
        startTime: startTime.toISOString()
      };
      console.log('Sending payload:', payload);

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/classes/update/${selectedClass._id}`,
        payload
      );
      console.log('Class updated response:', response.data);
      
      message.success('Class updated successfully');
      setEditModalVisible(false);
      setSelectedClass(null);
      editForm.resetFields();
      fetchUpcomingClasses();
    } catch (err) {
      console.error('Error updating class:', err);
      message.error(err.response?.data?.message || 'Failed to update class');
    }
  };

  // Show edit modal
  const showEditModal = (classData) => {
    setSelectedClass(classData);
    editForm.setFieldsValue({
      ...classData,
      startTime: moment(classData.startTime)
    });
    setEditModalVisible(true);
  };

  const classColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime) => moment(startTime).format('MMMM Do YYYY, h:mm a'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => formatDuration(duration),
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color={program === '24-session' ? 'blue' : 'purple'}>
          {program}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (record.status === 'ongoing') {
          return (
            <Space direction="vertical" size="small">
              <Tag color="green">IN PROGRESS</Tag>
              {record.remainingTime > 0 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {record.remainingTime} min remaining
                </Text>
              )}
            </Space>
          );
        }
        return (
          <Tag color={record.status === 'scheduled' ? 'blue' : 'red'}>
            {record.status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            onClick={() => showUpcomingSessionDetails(record)}
            icon={<HistoryOutlined />}
          >
            View Details
          </Button>
          {record.status === 'scheduled' && (
            <>
              <Button 
                type="primary" 
                icon={<VideoCameraOutlined />}
                onClick={() => handleStartClass(record._id)}
              >
                Start Class
              </Button>
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => showEditModal(record)}
              >
                Edit
              </Button>
            </>
          )}
          {record.status === 'ongoing' && (
            <Button 
              type="primary" 
              onClick={() => handleJoinClass(record)}
              icon={<VideoCameraOutlined />}
            >
              Join Class
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Completed sessions columns
  const completedSessionsColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color={program === '24-session' ? 'blue' : 'purple'}>
          {program}
        </Tag>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'formattedStartTime',
      key: 'formattedStartTime',
    },
    {
      title: 'End Time',
      dataIndex: 'formattedEndTime',
      key: 'formattedEndTime',
    },
    {
      title: 'Duration',
      dataIndex: 'actualDuration',
      key: 'actualDuration',
      render: (duration) => formatDuration(duration),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => showSessionDetails(record)}
          icon={<HistoryOutlined />}
        >
          View Details
        </Button>
      ),
    }
  ];

  // Expired sessions columns
  const expiredSessionsColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color={program === '24-session' ? 'blue' : 'purple'}>
          {program}
        </Tag>
      ),
    },
    {
      title: 'Scheduled Start',
      dataIndex: 'formattedStartTime',
      key: 'formattedStartTime',
    },
    {
      title: 'Scheduled End',
      dataIndex: 'formattedScheduledEndTime',
      key: 'formattedScheduledEndTime',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => formatDuration(duration),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="default"
          onClick={() => showExpiredSessionDetails(record)}
          icon={<HistoryOutlined />}
        >
          View Details
        </Button>
      ),
    }
  ];

  // Attendance columns for the table
  const attendanceColumns = [
    {
      title: 'Student Name',
      dataIndex: ['studentId', 'fullName'],
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: ['studentId', 'email'],
      key: 'email',
    },
    {
      title: 'Program',
      dataIndex: ['studentId', 'program'],
      key: 'program',
      render: (program) => (
        <Tag color={program === '24-session' ? 'blue' : 'purple'}>
          {program}
        </Tag>
      ),
    },
    {
      title: 'Join Time',
      dataIndex: 'joinTime',
      key: 'joinTime',
      render: (time) => moment(time).format('hh:mm A'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} minutes`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          present: { color: 'success', icon: <CheckCircleOutlined /> },
          partial: { color: 'warning', icon: <FieldTimeOutlined /> },
          absent: { color: 'error', icon: <CloseCircleOutlined /> }
        };
        return (
          <Tag color={statusConfig[status].color} icon={statusConfig[status].icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    }
  ];

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

        {/* Add Attendance Card */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title={
              <Space>
                <TeamOutlined />
                <span>Class Attendance Summary</span>
              </Space>
            }>
              <Table
                dataSource={attendanceSummary}
                columns={[
                  {
                    title: 'Class Title',
                    dataIndex: ['class', 'title'],
                    key: 'title',
                  },
                  {
                    title: 'Date & Time',
                    dataIndex: ['class', 'startTime'],
                    key: 'startTime',
                    render: (time) => moment(time).format('MMMM Do YYYY, h:mm a'),
                  },
                  {
                    title: 'Total Students',
                    dataIndex: ['stats', 'totalStudents'],
                    key: 'totalStudents',
                  },
                  {
                    title: 'Present',
                    dataIndex: ['stats', 'present'],
                    key: 'present',
                    render: (present, record) => (
                      <Tag color="success">
                        {present} ({Math.round((present / record.stats.totalStudents) * 100)}%)
                      </Tag>
                    ),
                  },
                  {
                    title: 'Partial',
                    dataIndex: ['stats', 'partial'],
                    key: 'partial',
                    render: (partial) => <Tag color="warning">{partial}</Tag>,
                  },
                  {
                    title: 'Absent',
                    dataIndex: ['stats', 'absent'],
                    key: 'absent',
                    render: (absent) => <Tag color="error">{absent}</Tag>,
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Button
                        type="primary"
                        onClick={() => showAttendanceDetails(record.class._id)}
                      >
                        View Details
                      </Button>
                    ),
                  },
                ]}
                rowKey={record => record.class._id}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Completed Sessions Modal */}
        <Modal
          title={
            <Space>
              <HistoryOutlined />
              <span>Completed Sessions History</span>
            </Space>
          }
          open={completedSessionsModalVisible}
          onCancel={() => setCompletedSessionsModalVisible(false)}
          width={1000}
          footer={null}
        >
          <Table
            columns={completedSessionsColumns}
            dataSource={completedSessions}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Modal>

        {/* Session Detail Modal */}
        <Modal
          title={
            <Space>
              <HistoryOutlined />
              <span>Session Details</span>
            </Space>
          }
          open={sessionDetailModalVisible}
          onCancel={() => {
            setSessionDetailModalVisible(false);
            setSelectedCompletedSession(null);
          }}
          width={700}
          footer={[
            <Button 
              key="close" 
              type="primary"
              onClick={() => {
                setSessionDetailModalVisible(false);
                setSelectedCompletedSession(null);
              }}
            >
              Close
            </Button>
          ]}
        >
          {selectedCompletedSession && (
            <>
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Session Title">
                  {selectedCompletedSession.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedCompletedSession.description || 'No description provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color={selectedCompletedSession.program === '24-session' ? 'blue' : 'purple'}>
                    {selectedCompletedSession.program}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Timing Details</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Start Time">
                  {selectedCompletedSession.formattedStartTime}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {selectedCompletedSession.formattedEndTime}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {formatDuration(selectedCompletedSession.actualDuration)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Session Status</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Status">
                  <Tag color="red">COMPLETED</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(selectedCompletedSession.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {new Date(selectedCompletedSession.updatedAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Modal>

        {/* Upcoming Sessions List Modal */}
        <Modal
          title={
            <Space>
              <ClockCircleOutlined />
              <span>Upcoming Sessions</span>
            </Space>
          }
          open={upcomingSessionsModalVisible}
          onCancel={() => setUpcomingSessionsModalVisible(false)}
          width={1200}
          footer={null}
        >
          <Table
            columns={classColumns}
            dataSource={upcomingClasses}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Modal>

        {/* Upcoming Session Detail Modal */}
        <Modal
          title={
            <Space>
              <ClockCircleOutlined />
              <span>Session Details</span>
            </Space>
          }
          open={upcomingSessionDetailModalVisible}
          onCancel={() => {
            setUpcomingSessionDetailModalVisible(false);
            setSelectedUpcomingSession(null);
          }}
          width={700}
          footer={[
            <Button 
              key="close" 
              type="primary"
              onClick={() => {
                setUpcomingSessionDetailModalVisible(false);
                setSelectedUpcomingSession(null);
              }}
            >
              Close
            </Button>
          ]}
        >
          {selectedUpcomingSession && (
            <>
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Session Title">
                  {selectedUpcomingSession.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedUpcomingSession.description || 'No description provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color={selectedUpcomingSession.program === '24-session' ? 'blue' : 'purple'}>
                    {selectedUpcomingSession.program}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Timing Details</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Start Time">
                  {moment(selectedUpcomingSession.startTime).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Expected End Time">
                  {moment(selectedUpcomingSession.startTime).add(selectedUpcomingSession.duration, 'minutes').format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {formatDuration(selectedUpcomingSession.duration)}
                </Descriptions.Item>
                {selectedUpcomingSession.status === 'ongoing' && selectedUpcomingSession.remainingTime > 0 && (
                  <Descriptions.Item label="Remaining Time">
                    {formatDuration(selectedUpcomingSession.remainingTime)}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider orientation="left">Session Status</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Status">
                  <Tag color={
                    selectedUpcomingSession.status === 'scheduled' ? 'blue' : 
                    selectedUpcomingSession.status === 'ongoing' ? 'green' : 'red'
                  }>
                    {selectedUpcomingSession.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {moment(selectedUpcomingSession.createdAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {moment(selectedUpcomingSession.updatedAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
              </Descriptions>

              {selectedUpcomingSession.status === 'ongoing' && selectedUpcomingSession.meetingLink && (
                <>
                  <Divider orientation="left">Meeting Details</Divider>
                  <Descriptions
                    bordered
                    column={1}
                    size="small"
                    labelStyle={{ fontWeight: 'bold', width: '150px' }}
                  >
                    <Descriptions.Item label="Meeting Link">
                      <Button 
                        type="primary" 
                        href={selectedUpcomingSession.meetingLink}
                        target="_blank"
                        icon={<VideoCameraOutlined />}
                      >
                        Join Meeting
                      </Button>
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </>
          )}
        </Modal>

        {/* Expired Sessions Modal */}
        <Modal
          title={
            <Space>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <span>Expired Sessions</span>
            </Space>
          }
          open={expiredSessionsModalVisible}
          onCancel={() => setExpiredSessionsModalVisible(false)}
          width={1000}
          footer={[
            <Button
              key="check"
              type="primary"
              onClick={checkExpiredClasses}
              icon={<SyncOutlined />}
            >
              Check for Expired Classes
            </Button>
          ]}
        >
          <Alert
            message="These sessions were not started at their scheduled time"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={expiredSessionsColumns}
            dataSource={expiredSessions}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Modal>

        {/* Expired Session Detail Modal */}
        <Modal
          title={
            <Space>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <span>Expired Session Details</span>
            </Space>
          }
          open={expiredSessionDetailModalVisible}
          onCancel={() => {
            setExpiredSessionDetailModalVisible(false);
            setSelectedExpiredSession(null);
          }}
          width={700}
          footer={[
            <Button 
              key="close" 
              type="primary"
              onClick={() => {
                setExpiredSessionDetailModalVisible(false);
                setSelectedExpiredSession(null);
              }}
            >
              Close
            </Button>
          ]}
        >
          {selectedExpiredSession && (
            <>
              <Alert
                message="This session was not started at the scheduled time"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Session Title">
                  {selectedExpiredSession.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedExpiredSession.description || 'No description provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color={selectedExpiredSession.program === '24-session' ? 'blue' : 'purple'}>
                    {selectedExpiredSession.program}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Scheduled Timing</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Scheduled Start">
                  {selectedExpiredSession.formattedStartTime}
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled End">
                  {selectedExpiredSession.formattedScheduledEndTime}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {formatDuration(selectedExpiredSession.duration)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Additional Information</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Status">
                  <Tag color="red">EXPIRED</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {moment(selectedExpiredSession.createdAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {moment(selectedExpiredSession.updatedAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Modal>

        {/* Class Attendance Modal */}
        <Modal
          title={
            <Space>
              <TeamOutlined />
              <span>Class Attendance Details</span>
            </Space>
          }
          open={attendanceModalVisible}
          onCancel={() => {
            setAttendanceModalVisible(false);
            setSelectedClassAttendance(null);
          }}
          width={1000}
          footer={null}
        >
          {selectedClassAttendance && (
            <>
              <Descriptions title="Class Information" bordered>
                <Descriptions.Item label="Title">{selectedClassAttendance.classDetails.title}</Descriptions.Item>
                <Descriptions.Item label="Start Time">
                  {moment(selectedClassAttendance.classDetails.startTime).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {selectedClassAttendance.classDetails.duration} minutes
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="Total Students"
                    value={selectedClassAttendance.stats.totalStudents}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Present"
                    value={selectedClassAttendance.stats.present}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Partial"
                    value={selectedClassAttendance.stats.partial}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<FieldTimeOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Absent"
                    value={selectedClassAttendance.stats.absent}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
              </Row>

              <Divider />

              <Table
                columns={attendanceColumns}
                dataSource={selectedClassAttendance.attendance}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            </>
          )}
        </Modal>

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

        {/* Edit Class Modal */}
        <Modal
          title="Edit Class"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedClass(null);
            editForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditClass}
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
                Update Class
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Jitsi Meeting Modal */}
        <JitsiMeeting
          isOpen={jitsiModalVisible}
          onClose={() => setJitsiModalVisible(false)}
          meetingLink={activeClass?.meetingLink}
          classId={activeClass?._id}
          isAdmin={true}
          onEndClass={handleEndClass}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;