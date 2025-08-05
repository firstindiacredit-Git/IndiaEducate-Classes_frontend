import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Space,
  Button,
  Divider,
  Tag,
  List,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;

const QuizResult = () => {
  const { submissionId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch submission details
  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/quizzes/submission/${submissionId}`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setSubmission(response.data);
    } catch (err) {
      console.error('Error fetching submission:', err);
      navigate('/quiz-history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const getAnswerStatus = (answer) => {
    return answer.isCorrect ? 
      <Tag color="green" icon={<CheckCircleOutlined />}>Correct</Tag> : 
      <Tag color="red" icon={<CloseCircleOutlined />}>Incorrect</Tag>;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <Text>Loading quiz result...</Text>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <Text>Quiz result not found</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      
      <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 24px' }}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>Quiz Result</Title>
            <Text type="secondary">{submission.quiz.title}</Text>
          </Col>
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/quiz-history')}
            >
              Back to History
            </Button>
          </Col>
        </Row>

        {/* Result Summary */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Score"
                value={submission.totalMarksObtained}
                suffix={`/ ${submission.quiz.totalMarks}`}
                valueStyle={{ color: submission.isPassed ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Percentage"
                value={submission.percentage}
                suffix="%"
                valueStyle={{ color: submission.isPassed ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Status"
                value={submission.isPassed ? 'Passed' : 'Failed'}
                prefix={submission.isPassed ? <TrophyOutlined /> : <CloseCircleOutlined />}
                valueStyle={{ color: submission.isPassed ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="Duration"
                value={submission.duration}
                suffix="min"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>

          <Progress 
            percent={submission.percentage}
            status={submission.isPassed ? 'success' : 'exception'}
            style={{ marginTop: 16 }}
          />

          {submission.adminFeedback && (
            <Alert
              message="Admin Feedback"
              description={submission.adminFeedback}
              type="info"
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        {/* Quiz Details */}
        <Card title="Quiz Details" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Subject:</Text> {submission.quiz.subject.replace('_', ' ').toUpperCase()}
            </Col>
            <Col span={12}>
              <Text strong>Type:</Text> {submission.quiz.type.replace('_', ' ').toUpperCase()}
            </Col>
            <Col span={12}>
              <Text strong>Attempt:</Text> {submission.attempts}
            </Col>
            <Col span={12}>
              <Text strong>Completed:</Text> {moment(submission.endTime).format('MMM DD, YYYY HH:mm')}
            </Col>
          </Row>
        </Card>

        {/* Question Details */}
        <Card title="Question Details">
          <List
            dataSource={submission.answers}
            renderItem={(answer, index) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Question {index + 1}</Text>
                    <Space style={{ marginLeft: 16 }}>
                      {getAnswerStatus(answer)}
                      <Text type="secondary">
                        {answer.marksObtained} / {submission.quiz.questions[index]?.marks || 0} marks
                      </Text>
                    </Space>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>{submission.quiz.questions[index]?.question}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Your Answer: </Text>
                    <Text>{answer.answer}</Text>
                  </div>
                  {submission.quiz.questions[index]?.explanation && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Explanation: </Text>
                      <Text>{submission.quiz.questions[index].explanation}</Text>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default QuizResult; 