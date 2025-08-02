import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Space, Button, Modal, Descriptions, Divider, message, Row, Col, Statistic } from 'antd';
import { HistoryOutlined, CheckCircleOutlined, TeamOutlined, FieldTimeOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import moment from 'moment';
import momentTimezone from 'moment-timezone';

const { Title } = Typography;

const CompletedSessions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailModalVisible, setSessionDetailModalVisible] = useState(false);
  const [selectedClassAttendance, setSelectedClassAttendance] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);

  // Function to format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} minutes` : ''}`;
  };

  // Fetch completed sessions
  const fetchCompletedSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/completed-sessions`);
      setCompletedSessions(response.data.sessions);
    } catch (err) {
      console.error('Error fetching completed sessions:', err);
      message.error('Failed to fetch completed sessions');
    } finally {
      setLoading(false);
    }
  };

  // Show session details
  const showSessionDetails = (session) => {
    setSelectedSession(session);
    setSessionDetailModalVisible(true);
  };

  // Show attendance details
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

  useEffect(() => {
    fetchCompletedSessions();
  }, []);

  // Table columns for completed sessions
  const completedSessionsColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 70,
    },
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
        <Space>
          <Button
            type="primary"
            onClick={() => showSessionDetails(record)}
            icon={<HistoryOutlined />}
          >
            View Details
          </Button>
          <Button
            type="default"
            onClick={() => showAttendanceDetails(record._id)}
            icon={<TeamOutlined />}
          >
            View Attendance
          </Button>
        </Space>
      ),
    }
  ];

  // Attendance columns
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
          <Space>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin-dashboard')}
              style={{
                fontSize: '16px',
                marginRight: '8px',
                padding: 0
              }}
            />
            <Title level={2} style={{ margin: 0 }}>Completed Sessions</Title>
          </Space>
        </Row>

        <Card>
          <Table
            loading={loading}
            columns={completedSessionsColumns}
            dataSource={completedSessions}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>

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
            setSelectedSession(null);
          }}
          width={700}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => {
                setSessionDetailModalVisible(false);
                setSelectedSession(null);
              }}
            >
              Close
            </Button>
          ]}
        >
          {selectedSession && (
            <>
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Session Title">
                  {selectedSession.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedSession.description || 'No description provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color={selectedSession.program === '24-session' ? 'blue' : 'purple'}>
                    {selectedSession.program}
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
                  {selectedSession.formattedStartTime}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {selectedSession.formattedEndTime}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {formatDuration(selectedSession.actualDuration)}
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
                  <Tag color="green">COMPLETED</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {moment(selectedSession.createdAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {moment(selectedSession.updatedAt).format('MMMM Do YYYY, h:mm a')}
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
      </div>
    </div>
  );
};

export default CompletedSessions; 