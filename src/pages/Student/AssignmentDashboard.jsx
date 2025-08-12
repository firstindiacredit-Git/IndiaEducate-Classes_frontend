import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  List,
  Tag,
  Progress,
  Statistic,
  message,
  Badge,
  Space,
  Divider,
  Layout
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BookOutlined,
  UserOutlined,
  AudioOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;
const { Content } = Layout;

const AssignmentDashboard = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fetch available assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/available`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setAssignments(response.data);
    } catch {
      message.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance statistics
  const fetchPerformance = async () => {
    try {
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/performance`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setPerformance(response.data);
    } catch {
      message.error('Failed to fetch performance data');
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchPerformance();
  }, []);

  const handleStartAssignment = (assignment) => {
    navigate(`/submit-assignment/${assignment._id}`);
  };

  const handleViewHistory = () => {
    navigate('/assignment-history');
  };

  const getSubjectColor = (subject) => {
    const colors = {
      english: 'blue',
      hindi: 'green',
      mathematics: 'orange',
      science: 'purple',
      social_studies: 'cyan',
      general_knowledge: 'magenta'
    };
    return colors[subject] || 'default';
  };

  const getTypeIcon = (type) => {
    return type === 'audio' ? <AudioOutlined /> : <VideoCameraOutlined />;
  };

  const getTypeColor = (type) => {
    return type === 'audio' ? 'green' : 'blue';
  };

  const getStatusBadge = (assignment) => {
    if (assignment.isReviewed) {
      return assignment.isPassed ?
        <Badge status="success" text="Passed" /> :
        <Badge status="error" text="Failed" />;
    } else if (assignment.submissionStatus === 'submitted') {
      return <Badge status="processing" text="Under Review" />;
    } else if (assignment.submissionStatus === 'draft') {
      return <Badge status="warning" text="In Progress" />;
    } else {
      return <Badge status="default" text="Not Started" />;
    }
  };

  const getTimeRemaining = (endDate) => {
    const now = moment();
    const end = moment(endDate);
    const diff = end.diff(now, 'hours');

    if (diff < 0) return 'Expired';
    if (diff < 24) return `${diff} hours left`;
    return `${Math.floor(diff / 24)} days left`;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <Layout style={{ 
        marginLeft: sidebarCollapsed ? 80 : 250,
        transition: 'margin-left 0.2s ease'
      }}>
        <StudentNavbar />
        
        <Content style={{ 
          padding: '24px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}>
          <div style={{ 
            maxWidth: '100%', 
            margin: '0 auto',
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
              <Space align="center">
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/student-dashboard')}
                  style={{
                    fontSize: '16px',
                    marginRight: '8px',
                    padding: 0
                  }}
                />
                <Title level={2} style={{ margin: 0 }}>Speaking Assignments</Title>
              </Space>
              <Button type="primary" onClick={handleViewHistory}>
                View History
              </Button>
            </Row>

            {/* Performance Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Assignments"
                    value={performance.totalAssignments || 0}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Passed Assignments"
                    value={performance.passedAssignments || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Average Score"
                    value={performance.averagePercentage || 0}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Success Rate"
                    value={performance.totalAssignments ?
                      Math.round((performance.passedAssignments / performance.totalAssignments) * 100) : 0
                    }
                    suffix="%"
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Available Assignments */}
            <Card title="Available Assignments" loading={loading}>
              {assignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <BookOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <Text type="secondary">No assignments available at the moment</Text>
                </div>
              ) : (
                <List
                  dataSource={assignments}
                  renderItem={(assignment) => (
                    <List.Item
                      actions={[
                        assignment.isReviewed ? (
                          <Space>
                            <Text>Score: {assignment.score}/{assignment.totalMarks}</Text>
                            <Progress
                              type="circle"
                              size="small"
                              percent={assignment.percentage}
                              format={percent => `${percent}%`}
                            />
                          </Space>
                        ) : (
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleStartAssignment(assignment)}
                            disabled={assignment.submissionStatus === 'submitted'}
                          >
                            {assignment.submissionStatus === 'submitted' ? 'Under Review' : 
                             assignment.submissionStatus === 'draft' ? 'Continue' : 'Start Assignment'}
                          </Button>
                        )
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{assignment.title}</span>
                            {getStatusBadge(assignment)}
                          </Space>
                        }
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              <Text type="secondary">{assignment.description}</Text>
                            </div>
                            <Space size="large">
                              <Tag color={getSubjectColor(assignment.subject)}>
                                {assignment.subject.replace('_', ' ').toUpperCase()}
                              </Tag>
                              <Tag color={getTypeColor(assignment.type)} icon={getTypeIcon(assignment.type)}>
                                {assignment.type.toUpperCase()}
                              </Tag>
                              <Text type="secondary">
                                <ClockCircleOutlined /> {assignment.duration} min
                              </Text>
                              <Text type="secondary">
                                <TrophyOutlined /> {assignment.totalMarks} marks
                              </Text>
                              <Text type="secondary">
                                {getTimeRemaining(assignment.endDate)}
                              </Text>
                            </Space>
                            <div style={{ marginTop: 8 }}>
                              <Text strong>Paragraph to Read:</Text>
                              <div style={{ 
                                marginTop: 4, 
                                padding: '8px 12px', 
                                backgroundColor: '#f5f5f5', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                maxHeight: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {assignment.paragraph}
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* Subject Performance */}
            {Object.keys(performance.subjectPerformance || {}).length > 0 && (
              <Card title="Performance by Subject" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  {Object.entries(performance.subjectPerformance).map(([subject, stats]) => (
                    <Col xs={24} sm={12} lg={8} key={subject}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Text strong style={{ textTransform: 'capitalize' }}>
                            {subject.replace('_', ' ')}
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Progress
                              type="circle"
                              size="small"
                              percent={Math.round(stats.averageScore)}
                              format={percent => `${percent}%`}
                            />
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">
                              {stats.passed}/{stats.total} passed
                            </Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AssignmentDashboard; 