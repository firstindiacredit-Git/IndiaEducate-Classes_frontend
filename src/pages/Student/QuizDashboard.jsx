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
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BookOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;

const QuizDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Fetch available quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/quizzes/available`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setQuizzes(response.data);
    } catch (err) {
      message.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance statistics
  const fetchPerformance = async () => {
    try {
      setPerformanceLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/quizzes/performance`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setPerformance(response.data);
    } catch (err) {
      message.error('Failed to fetch performance data');
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchPerformance();
  }, []);

  const handleStartQuiz = (quiz) => {
    navigate(`/take-quiz/${quiz._id}`);
  };

  const handleViewHistory = () => {
    navigate('/quiz-history');
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

  const getStatusBadge = (quiz) => {
    if (quiz.isCompleted) {
      return quiz.isPassed ?
        <Badge status="success" text="Passed" /> :
        <Badge status="error" text="Failed" />;
    } else if (quiz.submissionStatus === 'in_progress') {
      return <Badge status="processing" text="In Progress" />;
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
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
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
            <Title level={2} style={{ margin: 0 }}>Quizzes & Assignments</Title>
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
                title="Total Quizzes"
                value={performance.totalQuizzes || 0}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Passed Quizzes"
                value={performance.passedQuizzes || 0}
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
                value={performance.totalQuizzes ?
                  Math.round((performance.passedQuizzes / performance.totalQuizzes) * 100) : 0
                }
                suffix="%"
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Available Quizzes */}
        <Card title="Available Quizzes" loading={loading}>
          {quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <BookOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <Text type="secondary">No quizzes available at the moment</Text>
            </div>
          ) : (
            <List
              dataSource={quizzes}
              renderItem={(quiz) => (
                <List.Item
                  actions={[
                    quiz.isCompleted ? (
                      <Space>
                        <Text>Score: {quiz.score}/{quiz.totalMarks}</Text>
                        <Progress
                          type="circle"
                          size="small"
                          percent={quiz.percentage}
                          format={percent => `${percent}%`}
                        />
                      </Space>
                    ) : (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartQuiz(quiz)}
                        disabled={quiz.submissionStatus === 'in_progress'}
                      >
                        {quiz.submissionStatus === 'in_progress' ? 'Continue' : 'Start Quiz'}
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{quiz.title}</span>
                        {getStatusBadge(quiz)}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary">{quiz.description}</Text>
                        </div>
                        <Space size="large">
                          <Tag color={getSubjectColor(quiz.subject)}>
                            {quiz.subject.replace('_', ' ').toUpperCase()}
                          </Tag>
                          <Tag color="blue">
                            {quiz.type.replace('_', ' ').toUpperCase()}
                          </Tag>
                          <Text type="secondary">
                            <ClockCircleOutlined /> {quiz.duration} min
                          </Text>
                          <Text type="secondary">
                            <TrophyOutlined /> {quiz.totalMarks} marks
                          </Text>
                          <Text type="secondary">
                            {getTimeRemaining(quiz.endDate)}
                          </Text>
                        </Space>
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
    </div>
  );
};

export default QuizDashboard; 