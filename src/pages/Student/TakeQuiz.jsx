import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Button, 
  Radio, 
  Checkbox, 
  Input, 
  Space, 
  Progress, 
  message,
  Modal,
  Result,
  Statistic,
  Row,
  Col,
  Alert,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TakeQuiz = () => {
  const { quizId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Fetch quiz details
  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/quizzes/${quizId}/start`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setQuiz(response.data);
      setTimeLeft(response.data.duration * 60); // Convert to seconds
      setStartTime(new Date());
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load quiz');
      navigate('/quiz-dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, showResult]);

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const answersArray = Object.keys(answers).map(questionIndex => ({
        questionIndex: parseInt(questionIndex),
        answer: answers[questionIndex],
        timeSpent: 0 // Could track individual question time
      }));

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/quizzes/${quizId}/submit`, {
        studentEmailOrPhone: emailOrPhone,
        answers: answersArray,
        submissionId: quiz.submissionId
      });

      setResult(response.data.result);
      setShowResult(true);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question, index) => {
    const isCurrentQuestion = index === currentQuestion;
    const isAnswered = answers[index] !== undefined;

    if (!isCurrentQuestion) return null;

    return (
      <Card key={index} style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Question {index + 1} of {quiz.questions.length}</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            ({question.marks} marks)
          </Text>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: '16px' }}>{question.question}</Text>
        </div>

        {question.type === 'multiple_choice' && (
          <Radio.Group
            value={answers[index]}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          >
            <Space direction="vertical">
              {question.options.map((option, optIndex) => (
                <Radio key={optIndex} value={option}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}

        {question.type === 'true_false' && (
          <Radio.Group
            value={answers[index]}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="true">True</Radio>
              <Radio value="false">False</Radio>
            </Space>
          </Radio.Group>
        )}

        {question.type === 'fill_blank' && (
          <Input
            placeholder="Enter your answer"
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          />
        )}

        {question.type === 'short_answer' && (
          <TextArea
            rows={4}
            placeholder="Enter your answer"
            value={answers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
          />
        )}
      </Card>
    );
  };

  const renderQuestionNavigation = () => {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <Text>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Text>
          
          <Button 
            icon={<ArrowRightOutlined />} 
            onClick={handleNextQuestion}
            disabled={currentQuestion === quiz.questions.length - 1}
          >
            Next
          </Button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {quiz.questions.map((_, index) => (
            <Button
              key={index}
              type={index === currentQuestion ? 'primary' : 'default'}
              size="small"
              onClick={() => setCurrentQuestion(index)}
              style={{
                backgroundColor: answers[index] ? '#52c41a' : undefined,
                borderColor: answers[index] ? '#52c41a' : undefined
              }}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <Text>Loading quiz...</Text>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <div style={{ maxWidth: 800, margin: '50px auto', padding: '0 24px' }}>
          <Result
            status={result.isPassed ? 'success' : 'error'}
            title={result.isPassed ? 'Congratulations! You passed!' : 'Quiz completed'}
            subTitle={`You scored ${result.marksObtained} out of ${result.totalMarks} marks`}
            extra={[
              <Button type="primary" key="dashboard" onClick={() => navigate('/quiz-dashboard')}>
                Back to Dashboard
              </Button>,
              <Button key="history" onClick={() => navigate('/quiz-history')}>
                View History
              </Button>
            ]}
          >
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Score"
                  value={result.marksObtained}
                  suffix={`/ ${result.totalMarks}`}
                  valueStyle={{ color: result.isPassed ? '#52c41a' : '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Percentage"
                  value={result.percentage}
                  suffix="%"
                  valueStyle={{ color: result.isPassed ? '#52c41a' : '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Status"
                  value={result.isPassed ? 'Passed' : 'Failed'}
                  valueStyle={{ color: result.isPassed ? '#52c41a' : '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Result>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      
      <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 24px' }}>
        {/* Quiz Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>{quiz.title}</Title>
              <Text type="secondary">{quiz.description}</Text>
            </Col>
            <Col>
              <Space direction="vertical" align="end">
                <Alert
                  message={`Time remaining: ${formatTime(timeLeft)}`}
                  type={timeLeft < 300 ? 'warning' : 'info'}
                  icon={<ClockCircleOutlined />}
                  showIcon
                />
                <Progress 
                  percent={((quiz.duration * 60 - timeLeft) / (quiz.duration * 60)) * 100}
                  size="small"
                  status={timeLeft < 300 ? 'exception' : 'active'}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Question Navigation */}
        {renderQuestionNavigation()}

        {/* Current Question */}
        {renderQuestion(quiz.questions[currentQuestion], currentQuestion)}

        {/* Submit Button */}
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Text>
                Answered: {Object.keys(answers).length} / {quiz.questions.length} questions
              </Text>
            </Col>
            <Col>
              <Space>
                <Button onClick={() => navigate('/quiz-dashboard')}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleSubmitQuiz}
                  loading={submitting}
                  disabled={Object.keys(answers).length === 0}
                >
                  Submit Quiz
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default TakeQuiz; 