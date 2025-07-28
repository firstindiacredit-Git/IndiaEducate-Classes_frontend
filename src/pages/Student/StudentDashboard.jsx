import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Row, Col, Progress, Space } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { 
  FilePdfOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  TrophyOutlined,
  LineChartOutlined,
  QuestionCircleOutlined,
  MailOutlined
} from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const { profile } = useAuth();
  const firstName = profile?.fullName?.split(' ')[0] || 'Student';

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
            <Card title="LIVE CLASS">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Join join</Text>
                <Text>Starts in 10:34</Text>
                <Button type="primary" size="large">
                  Join
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Class Schedule Card */}
          <Col xs={24} md={12}>
            <Card title="CLASS SCHEDULE">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} style={{ fontWeight: 'bold' }}>{day}</div>
                ))}
                {Array(31).fill(null).map((_, i) => {
                  const isHighlighted = i + 1 === 17 || i + 1 === 19;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '4px',
                        backgroundColor: isHighlighted ? '#1890ff' : 'transparent',
                        color: isHighlighted ? 'white' : 'inherit',
                        borderRadius: '4px'
                      }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
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