import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Row, Col, Progress, Space, Table, Tag, message, Empty } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import moment from 'moment';
import { 
  FilePdfOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  TrophyOutlined,
  LineChartOutlined,
  QuestionCircleOutlined,
  MailOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = profile?.fullName?.split(' ')[0] || 'Student';

  // Fetch upcoming classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const studentProgram = profile?.program || '24-session';
      console.log('Student program:', studentProgram);
      console.log('Fetching classes for program:', studentProgram);
      
      const [upcomingRes, activeRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/upcoming/${studentProgram}`),
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/active/${studentProgram}`)
      ]);
      
      console.log('Upcoming classes response:', upcomingRes.data);
      console.log('Active class response:', activeRes.data);
      
      setUpcomingClasses(upcomingRes.data);
      setActiveClass(activeRes.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      message.error('Failed to fetch class schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.program) {
      fetchClasses();
      // Poll for active classes every minute
      const interval = setInterval(fetchClasses, 60000);
      return () => clearInterval(interval);
    }
  }, [profile?.program]);

  // Function to format time until class starts
  const getTimeUntilClass = (startTime) => {
    const now = moment();
    const start = moment(startTime);
    const duration = moment.duration(start.diff(now));
    
    if (duration.asHours() >= 24) {
      return `${Math.floor(duration.asDays())} days`;
    } else if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())} hours`;
    } else {
      return `${Math.floor(duration.asMinutes())} minutes`;
    }
  };

  // Function to check if a class is about to start (within next 30 minutes)
  const isClassStartingSoon = (startTime) => {
    const now = moment();
    const start = moment(startTime);
    const minutesUntilStart = start.diff(now, 'minutes');
    return minutesUntilStart <= 30 && minutesUntilStart > 0;
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
      render: (duration) => `${duration} minutes`,
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
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      <div style={{ padding: '24px 40px' }}>
        <Title level={2}>Welcome, {firstName}</Title>
        <Text>Enrolled in: {profile?.program || '24-session'} Program</Text>
        
        <div style={{ marginTop: 20 }}>
          <Progress percent={25} showInfo={false} />
          <Text>6 of 24 sessions completed</Text>
        </div>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {/* Live Class Card */}
          <Col xs={24} md={12}>
            <Card title="LIVE CLASS" loading={loading}>
              {activeClass ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{activeClass.title}</Text>
                  <Text type="success">Class is in progress!</Text>
                  {activeClass.remainingTime > 0 ? (
                    <>
                      <Text type="warning">
                        {activeClass.remainingTime} minutes remaining
                      </Text>
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<VideoCameraOutlined />}
                        href={activeClass.meetingLink}
                        target="_blank"
                      >
                        Join Now
                      </Button>
                    </>
                  ) : (
                    <Text type="secondary">Class has ended</Text>
                  )}
                </Space>
              ) : upcomingClasses[0] ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{upcomingClasses[0].title}</Text>
                  <Text>
                    Starts in {getTimeUntilClass(upcomingClasses[0].startTime)}
                  </Text>
                  <Button 
                    type="default" 
                    size="large" 
                    disabled={!isClassStartingSoon(upcomingClasses[0].startTime)}
                  >
                    {isClassStartingSoon(upcomingClasses[0].startTime) ? 'Waiting to Start' : 'Not Started Yet'}
                </Button>
              </Space>
              ) : (
                <Empty description="No upcoming classes scheduled" />
              )}
            </Card>
          </Col>

          {/* Class Schedule Card */}
          <Col xs={24} md={12}>
            <Card 
              title="CLASS SCHEDULE" 
              extra={
                <Button type="link" icon={<CalendarOutlined />}>
                  View All
                </Button>
              }
            >
              <Table
                columns={classColumns}
                dataSource={upcomingClasses}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                loading={loading}
                locale={{
                  emptyText: <Empty description="No upcoming classes scheduled" />
                }}
              />
            </Card>
          </Col>

          {/* Study Materials Card */}
          <Col xs={24} md={12}>
            <Card title="STUDY MATERIALS">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<FilePdfOutlined />} block style={{ textAlign: 'left' }}>
                  PDF documents
                </Button>
                <Button icon={<VideoCameraOutlined />} block style={{ textAlign: 'left' }}>
                  Video lessons
                </Button>
                <Button icon={<AudioOutlined />} block style={{ textAlign: 'left' }}>
                  Audio files
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Certificates Card */}
          <Col xs={24} md={12}>
            <Card title="CERTIFICATES / ACHIEVEMENTS">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<TrophyOutlined />} block style={{ textAlign: 'left' }}>
                  View certificates
                </Button>
                <Button icon={<LineChartOutlined />} block style={{ textAlign: 'left' }}>
                  Track progress
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Quizzes Card */}
          <Col xs={24} md={12}>
            <Card title="QUIZZES / ASSIGNMENTS">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<QuestionCircleOutlined />} block style={{ textAlign: 'left' }}>
                  Take quizzes
                </Button>
                <Button block style={{ textAlign: 'left' }}>
                  Submit assignments
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Support Card */}
          <Col xs={24} md={12}>
            <Card title="SUPPORT">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<QuestionCircleOutlined />} block style={{ textAlign: 'left' }}>
                  Help Center
                </Button>
                <Button icon={<MailOutlined />} block style={{ textAlign: 'left' }}>
                  Contact us
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default StudentDashboard;