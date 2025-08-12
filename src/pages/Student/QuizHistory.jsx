import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Tag, 
  Progress, 
  Statistic, 
  message,
  Badge,
  Space,
  Row,
  Col,
  Button,
  Layout
} from 'antd';
import { 
  HistoryOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  EyeOutlined
} from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;
const { Content } = Layout;

const QuizHistory = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fetch quiz history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/quizzes/history`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setSubmissions(response.data);
    } catch {
      message.error('Failed to fetch quiz history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const getStatusBadge = (submission) => {
    if (submission.status === 'completed') {
      return submission.isPassed ? 
        <Badge status="success" text="Passed" /> : 
        <Badge status="error" text="Failed" />;
    } else if (submission.status === 'in_progress') {
      return <Badge status="processing" text="In Progress" />;
    } else if (submission.status === 'abandoned') {
      return <Badge status="default" text="Abandoned" />;
    } else {
      return <Badge status="default" text="Timeout" />;
    }
  };

  const columns = [
    {
      title: 'Quiz',
      dataIndex: 'quiz',
      key: 'quiz',
      render: (quiz) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{quiz.title}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {quiz.subject.replace('_', ' ').toUpperCase()} • {quiz.type.replace('_', ' ').toUpperCase()}
          </Text>
        </div>
      )
    },
    {
      title: 'Score',
      key: 'score',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.totalMarksObtained} / {record.quiz.totalMarks}
          </div>
          <Progress 
            percent={record.percentage} 
            size="small"
            status={record.isPassed ? 'success' : 'exception'}
          />
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusBadge(record)
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div>{record.duration} min</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(record.startTime).format('MMM DD, YYYY')}
          </Text>
        </div>
      )
    },
    {
      title: 'Attempt',
      dataIndex: 'attempts',
      key: 'attempts',
      render: (attempts) => `Attempt ${attempts}`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/quiz-result/${record._id}`)}
        >
          View Details
        </Button>
      )
    }
  ];

  const getStats = () => {
    const completed = submissions.filter(s => s.status === 'completed');
    const passed = completed.filter(s => s.isPassed);
    const totalMarks = completed.reduce((sum, s) => sum + s.totalMarksObtained, 0);
    const maxMarks = completed.reduce((sum, s) => sum + s.quiz.totalMarks, 0);
    
    return {
      totalAttempts: submissions.length,
      completedAttempts: completed.length,
      passedAttempts: passed.length,
      averageScore: completed.length > 0 ? (totalMarks / maxMarks) * 100 : 0,
      successRate: completed.length > 0 ? (passed.length / completed.length) * 100 : 0
    };
  };

  const stats = getStats();

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
              <Title level={2}>Quiz History</Title>
              <Button type="primary" onClick={() => navigate('/quiz-dashboard')}>
                Back to Dashboard
              </Button>
            </Row>

            {/* Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Attempts"
                    value={stats.totalAttempts}
                    prefix={<HistoryOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Completed"
                    value={stats.completedAttempts}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Passed"
                    value={stats.passedAttempts}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Success Rate"
                    value={stats.successRate}
                    suffix="%"
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* History Table */}
            <Card title="Quiz Attempts" loading={loading}>
              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <HistoryOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <Text type="secondary">No quiz attempts yet</Text>
                </div>
              ) : (
                <Table
                  columns={columns}
                  dataSource={submissions}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                />
              )}
            </Card>

            {/* Performance by Subject */}
            {submissions.length > 0 && (
              <Card title="Performance by Subject" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  {Object.entries(
                    submissions
                      .filter(s => s.status === 'completed')
                      .reduce((acc, submission) => {
                        const subject = submission.quiz.subject;
                        if (!acc[subject]) {
                          acc[subject] = { total: 0, passed: 0, totalScore: 0, maxScore: 0 };
                        }
                        acc[subject].total++;
                        acc[subject].totalScore += submission.totalMarksObtained;
                        acc[subject].maxScore += submission.quiz.totalMarks;
                        if (submission.isPassed) acc[subject].passed++;
                        return acc;
                      }, {})
                  ).map(([subject, stats]) => (
                    <Col xs={24} sm={12} lg={8} key={subject}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Tag color={getSubjectColor(subject)} style={{ marginBottom: 8 }}>
                            {subject.replace('_', ' ').toUpperCase()}
                          </Tag>
                          <div style={{ marginBottom: 8 }}>
                            <Progress 
                              type="circle" 
                              size="small" 
                              percent={Math.round((stats.totalScore / stats.maxScore) * 100)} 
                              format={percent => `${percent}%`}
                            />
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {stats.passed}/{stats.total} passed
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

export default QuizHistory; 