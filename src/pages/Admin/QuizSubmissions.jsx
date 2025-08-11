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
  Modal,
  Form,
  Input,
  InputNumber,
  Divider,
  Layout
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  EditOutlined,
  FileTextOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Content } = Layout;

const QuizSubmissions = () => {
  const { quizId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [form] = Form.useForm();

  // Fetch quiz details and submissions
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz details
      const quizResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${quizId}`);
      setQuiz(quizResponse.data);
      
      // Fetch submissions
      const submissionsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${quizId}/submissions`);
      setSubmissions(submissionsResponse.data);
      
      // Fetch statistics
      const statsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${quizId}/statistics`);
      setStats(statsResponse.data);
    } catch (err) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const handleReview = (submission) => {
    setSelectedSubmission(submission);
    form.setFieldsValue({
      adminFeedback: submission.adminFeedback || '',
      adminScore: submission.adminScore || submission.totalMarksObtained
    });
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    try {
      const emailOrPhone = localStorage.getItem('adminEmailOrPhone') || profile?.email;
      await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/submission/${selectedSubmission._id}/review`, {
        adminFeedback: values.adminFeedback,
        adminScore: values.adminScore,
        adminEmailOrPhone: emailOrPhone
      });
      
      message.success('Review submitted successfully');
      message.info('Student has been notified about the review.');
      setReviewModalVisible(false);
      fetchData(); // Refresh data
    } catch (err) {
      message.error('Failed to submit review');
    }
  };

  const getStatusBadge = (submission) => {
    if (submission.status === 'completed') {
      return submission.isPassed ? 
        <Badge status="success" text="Passed" /> : 
        <Badge status="error" text="Failed" />;
    } else if (submission.status === 'in_progress') {
      return <Badge status="processing" text="In Progress" />;
    } else {
      return <Badge status="default" text={submission.status} />;
    }
  };

  const columns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      render: (student) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{student.fullName}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {student.email}
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
      title: 'Review',
      key: 'review',
      render: (_, record) => (
        <Space>
          {record.isReviewed && (
            <Tag color="green">Reviewed</Tag>
          )}
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleReview(record)}
          >
            Review
          </Button>
        </Space>
      )
    }
  ];

  if (!quiz) return null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <AdminNavbar />
        
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Title level={2}>Quiz Submissions: {quiz.title}</Title>
            <Button type="primary" onClick={() => navigate('/quiz-management')}>
              Back to Quiz Management
            </Button>
          </Row>

          {/* Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Submissions"
                  value={stats.totalSubmissions || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Completed"
                  value={stats.completedSubmissions || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Passed"
                  value={stats.passedSubmissions || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Average Score"
                  value={Math.round(stats.averageScore || 0)}
                  suffix="%"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Submissions Table */}
          <Card title="Student Submissions" loading={loading}>
            {submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">No submissions yet</Text>
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

          {/* Review Modal */}
          <Modal
            title="Review Submission"
            open={reviewModalVisible}
            onCancel={() => setReviewModalVisible(false)}
            footer={null}
            width={600}
          >
            {selectedSubmission && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Student: {selectedSubmission.student.fullName}</Text>
                  <br />
                  <Text type="secondary">Score: {selectedSubmission.totalMarksObtained} / {selectedSubmission.quiz.totalMarks}</Text>
                  <br />
                  <Text type="secondary">Percentage: {selectedSubmission.percentage}%</Text>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmitReview}
                >
                  <Form.Item
                    name="adminScore"
                    label="Admin Score (Optional)"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (value && (value < 0 || value > selectedSubmission.quiz.totalMarks)) {
                            return Promise.reject(`Score must be between 0 and ${selectedSubmission.quiz.totalMarks}`);
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <InputNumber 
                      min={0} 
                      max={selectedSubmission.quiz.totalMarks}
                      style={{ width: '100%' }}
                      placeholder="Enter admin score (optional)"
                    />
                  </Form.Item>

                  <Form.Item
                    name="adminFeedback"
                    label="Admin Feedback"
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Enter feedback for the student (optional)"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        Submit Review
                      </Button>
                      <Button onClick={() => setReviewModalVisible(false)}>
                        Cancel
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default QuizSubmissions; 