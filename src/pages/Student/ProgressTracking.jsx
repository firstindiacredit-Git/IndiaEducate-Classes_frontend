import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Progress, 
  Space, 
  Badge, 
  Empty, 
  Divider, 
  Button, 
  message,
  Avatar,
  Tag,
  Statistic,
  Modal,
  Layout
} from 'antd';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';
import {
  TrophyOutlined,
  QuestionCircleOutlined,
  VideoCameraOutlined,
  LineChartOutlined,
  StarOutlined,
  FireOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;
const { Content } = Layout;

const ProgressTracking = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [assignmentsModalVisible, setAssignmentsModalVisible] = useState(false);
  const [quizzesModalVisible, setQuizzesModalVisible] = useState(false);
  const [liveClassesModalVisible, setLiveClassesModalVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);  
  
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/detailed-progress`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setProgressData(response.data);
      
      // Show notifications for new badges
      if (response.data.newBadges && response.data.newBadges.length > 0) {
        response.data.newBadges.forEach(badge => {
          message.success({
            content: (
              <div>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                  🎉 Congratulations! You earned a new badge!
                </div>
                <div style={{ fontSize: '14px' }}>
                  {badge.icon} {badge.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {badge.description}
                </div>
              </div>
            ),
            duration: 5,
            style: {
              marginTop: '20px',
            },
          });
        });
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
      message.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const getCategoryIcon = (category) => {
    const icons = {
      overall: <CrownOutlined />,
      assignments: <TrophyOutlined />,
      quizzes: <QuestionCircleOutlined />,
      attendance: <VideoCameraOutlined />,
      skills: <StarOutlined />,
      streak: <FireOutlined />,
      milestone: <CheckCircleOutlined />
    };
    return icons[category] || <StarOutlined />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      overall: '#FFD700',
      assignments: '#722ed1',
      quizzes: '#52c41a',
      attendance: '#1890ff',
      skills: '#eb2f96',
      streak: '#ff4d4f',
      milestone: '#faad14'
    };
    return colors[category] || '#1890ff';
  };

  const getSkillIcon = (skill) => {
    const icons = {
      pronunciation: '🗣️',
      grammar: '📚',
      vocabulary: '📖',
      listening: '👂',
      speaking: '🎤'
    };
    return icons[skill] || '📝';
  };

  const getSkillColor = (skill) => {
    const colors = {
      pronunciation: '#eb2f96',
      grammar: '#722ed1',
      vocabulary: '#52c41a',
      listening: '#1890ff',
      speaking: '#faad14'
    };
    return colors[skill] || '#1890ff';
  };

  const getMotivationalMessage = (progressData) => {
    const progress = progressData.overall.progressPercentage;
    
    if (progress >= 90) {
      return {
        message: "You're absolutely crushing it! You're a learning superstar! 🌟",
        type: "success"
      };
    } else if (progress >= 75) {
      return {
        message: "Excellent progress! You're on track to become a master learner! 🚀",
        type: "success"
      };
    } else if (progress >= 50) {
      return {
        message: "Great job! You're making solid progress. Keep up the good work! 💪",
        type: "info"
      };
    } else if (progress >= 25) {
      return {
        message: "You're getting started! Every step counts towards your success! 📈",
        type: "warning"
      };
    } else {
      return {
        message: "Welcome to your learning journey! Let's start building your skills! 🎯",
        type: "info"
      };
    }
  };

  const getNextMilestone = (progressData) => {
    const progress = progressData.overall.progressPercentage;
    
    if (progress < 25) {
      return { target: 25, message: "Reach 25% progress to unlock your first milestone!" };
    } else if (progress < 50) {
      return { target: 50, message: "Reach 50% progress to earn the 'Good Progress' badge!" };
    } else if (progress < 75) {
      return { target: 75, message: "Reach 75% progress to earn the 'Excellent Progress' badge!" };
    } else if (progress < 90) {
      return { target: 90, message: "Reach 90% progress to become a 'Master Learner'!" };
    } else {
      return { target: 100, message: "You're almost there! Complete all activities to reach 100%!" };
    }
  };

  const filteredBadges = progressData?.badges?.filter(badge => 
    selectedCategory === 'all' || badge.category === selectedCategory
  ) || [];

  const categories = [
    { key: 'all', label: 'All Badges', count: progressData?.badges?.length || 0 },
    { key: 'overall', label: 'Overall Progress', count: progressData?.achievements?.categories?.overall || 0 },
    { key: 'assignments', label: 'Assignments', count: progressData?.achievements?.categories?.assignments || 0 },
    { key: 'quizzes', label: 'Quizzes', count: progressData?.achievements?.categories?.quizzes || 0 },
    { key: 'attendance', label: 'Attendance', count: progressData?.achievements?.categories?.attendance || 0 },
    { key: 'skills', label: 'Skills', count: progressData?.achievements?.categories?.skills || 0 },
    { key: 'streak', label: 'Streaks', count: progressData?.achievements?.categories?.streak || 0 },
    { key: 'milestone', label: 'Milestones', count: progressData?.achievements?.categories?.milestone || 0 }
  ];

  if (loading) {
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
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Title level={2}>Loading Progress...</Title>
          </Content>
        </Layout>
      </Layout>
    );
  }

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
            {/* Header */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
              <Col>
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
                  <Title level={2} style={{ margin: 0 }}>Progress Tracking & Achievements</Title>
                </Space>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Track your learning journey and earn badges</Text>
                </div>
                
                {/* Motivational Message */}
                {progressData && (
                  <Card 
                    size="small" 
                    style={{ 
                      marginTop: 16, 
                      backgroundColor: '#f6ffed', 
                      border: '1px solid #b7eb8f' 
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                        {getMotivationalMessage(progressData).message}
                      </div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {getNextMilestone(progressData).message}
                      </Text>
                    </div>
                  </Card>
                )}
              </Col>
              <Col>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchProgressData}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Col>
            </Row>

            {progressData ? (
              <>
                {/* Overall Progress Summary */}
                <Card style={{ marginBottom: 24 }}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                      <Statistic
                        title="Overall Progress"
                        value={progressData.overall.progressPercentage}
                        suffix="%"
                        valueStyle={{ color: progressData.overall.progressPercentage >= 80 ? '#52c41a' : 
                                   progressData.overall.progressPercentage >= 50 ? '#1890ff' : '#ff4d4f' }}
                      />
                      <Progress
                        percent={progressData.overall.progressPercentage}
                        status={progressData.overall.progressPercentage >= 80 ? 'success' : 
                               progressData.overall.progressPercentage >= 50 ? 'active' : 'exception'}
                        strokeWidth={8}
                      />
                      <Text type="secondary">
                        {progressData.overall.completedActivities} of {progressData.overall.totalActivities} activities completed
                      </Text>
                    </Col>
                    <Col xs={24} md={8}>
                      <Statistic
                        title="Badges Earned"
                        value={progressData.achievements.totalBadges}
                        suffix="badges"
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Keep learning to earn more badges!</Text>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <Statistic
                        title="Remaining Activities"
                        value={progressData.overall.remainingActivities}
                        suffix="activities"
                        valueStyle={{ color: '#faad14' }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Complete more activities to progress</Text>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Progress Breakdown */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                  <Col xs={24} md={8}>
                    <Card 
                      title="Assignments Progress" 
                      size="small"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setAssignmentsModalVisible(true)}
                      hoverable
                    >
                      <Statistic
                        title="Completed"
                        value={progressData.breakdown.assignments.completed}
                        suffix={`/ ${progressData.breakdown.assignments.total}`}
                      />
                      <Progress
                        percent={progressData.breakdown.assignments.percentage}
                        status={progressData.breakdown.assignments.percentage >= 80 ? 'success' : 'active'}
                        strokeWidth={6}
                      />
                      <Text type="secondary">
                        {progressData.breakdown.assignments.passed} passed
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Click to view details
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card 
                      title="Quizzes Progress" 
                      size="small"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setQuizzesModalVisible(true)}
                      hoverable
                    >
                      <Statistic
                        title="Completed"
                        value={progressData.breakdown.quizzes.completed}
                        suffix={`/ ${progressData.breakdown.quizzes.total}`}
                      />
                      <Progress
                        percent={progressData.breakdown.quizzes.percentage}
                        status={progressData.breakdown.quizzes.percentage >= 80 ? 'success' : 'active'}
                        strokeWidth={6}
                      />
                      <Text type="secondary">
                        {progressData.breakdown.quizzes.passed} passed
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Click to view details
                        </Text>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card 
                      title="Live Classes Progress" 
                      size="small"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setLiveClassesModalVisible(true)}
                      hoverable
                    >
                      <Statistic
                        title="Attended"
                        value={progressData.breakdown.attendance.attended}
                        suffix={`/ ${progressData.breakdown.attendance.total}`}
                      />
                      <Progress
                        percent={progressData.breakdown.attendance.percentage}
                        status={progressData.breakdown.attendance.percentage >= 80 ? 'success' : 'active'}
                        strokeWidth={6}
                      />
                      <Text type="secondary">
                        {progressData.breakdown.attendance.percentage}% attendance rate
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Click to view details
                        </Text>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Skills Progress */}
                <Card title="Skills Progress" style={{ marginBottom: 24 }}>
                  <Row gutter={[16, 16]}>
                    {Object.entries(progressData.skills).map(([skill, data]) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={skill}>
                        <Card size="small" style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', marginBottom: 8 }}>
                            {getSkillIcon(skill)}
                          </div>
                          <Text strong style={{ textTransform: 'capitalize' }}>
                            {skill.replace('_', ' ')}
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Progress
                              percent={data.percentage}
                              size="small"
                              status={data.percentage >= 80 ? 'success' : 'active'}
                              strokeColor={getSkillColor(skill)}
                            />
                          </div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {data.total} activities completed
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* Badges Section */}
                <Card 
                  title={
                    <Space>
                      <TrophyOutlined />
                      <span>Badges & Achievements</span>
                    </Space>
                  }
                  style={{ marginBottom: 24 }}
                >
                  {/* Category Filter */}
                  <div style={{ marginBottom: 16 }}>
                    <Space wrap>
                      {categories.map(category => (
                        <Button
                          key={category.key}
                          type={selectedCategory === category.key ? 'primary' : 'default'}
                          icon={getCategoryIcon(category.key)}
                          onClick={() => setSelectedCategory(category.key)}
                          style={{
                            borderColor: getCategoryColor(category.key),
                            color: selectedCategory === category.key ? '#fff' : getCategoryColor(category.key)
                          }}
                        >
                          {category.label} ({category.count})
                        </Button>
                      ))}
                    </Space>
                  </div>

                  {/* Badges Display */}
                  {filteredBadges.length > 0 ? (
                    <Row gutter={[16, 16]}>
                      {filteredBadges.map((badge) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={badge.id}>
                          <Card
                            size="small"
                            style={{
                              textAlign: 'center',
                              border: `2px solid ${badge.color}`,
                              backgroundColor: `${badge.color}10`
                            }}
                            hoverable
                          >
                            <div style={{ fontSize: '48px', marginBottom: 8 }}>
                              {badge.icon}
                            </div>
                            <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: 4 }}>
                              {badge.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                              {badge.description}
                            </Text>
                            <Tag 
                              color={badge.color} 
                              style={{ marginTop: 8 }}
                            >
                              {badge.category.replace('_', ' ').toUpperCase()}
                            </Tag>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Empty 
                      description={
                        selectedCategory === 'all' 
                          ? "No badges earned yet. Keep learning to earn your first badge!" 
                          : `No ${selectedCategory} badges earned yet.`
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </Card>

                {/* Achievement Summary */}
                <Card title="Achievement Summary">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Total Badges"
                        value={progressData.achievements.totalBadges}
                        suffix="earned"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Overall Progress"
                        value={progressData.overall.progressPercentage}
                        suffix="%"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Activities Completed"
                        value={progressData.overall.completedActivities}
                        suffix="activities"
                      />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Statistic
                        title="Skills Mastered"
                        value={Object.values(progressData.skills).filter(skill => skill.percentage >= 80).length}
                        suffix="skills"
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Assignments Detailed Modal */}
                <Modal
                  title={
                    <Space>
                      <TrophyOutlined style={{ color: '#1890ff' }} />
                      <span>Assignments Details</span>
                    </Space>
                  }
                  open={assignmentsModalVisible}
                  onCancel={() => setAssignmentsModalVisible(false)}
                  footer={null}
                  width={800}
                >
                  {progressData?.breakdown?.assignments ? (
                    <div>
                      {/* Overall Progress */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text strong>Overall Assignment Progress</Text>
                          <Text type="secondary">
                            {progressData.breakdown.assignments.completed || 0} of {progressData.breakdown.assignments.total || 0} assignments completed
                          </Text>
                        </div>
                        <Progress
                          percent={progressData.breakdown.assignments.percentage || 0}
                          status={(progressData.breakdown.assignments.percentage || 0) >= 80 ? 'success' : 
                                 (progressData.breakdown.assignments.percentage || 0) >= 50 ? 'active' : 'exception'}
                          strokeWidth={12}
                          format={percent => `${percent}%`}
                        />
                      </div>

                      {/* Detailed Statistics */}
                      <Row gutter={[16, 16]}>
                        <Col xs={12}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
                            <Text strong style={{ color: '#52c41a' }}>{progressData.breakdown.assignments.completed || 0}</Text>
                            <br />
                            <Text type="secondary">Completed</Text>
                          </Card>
                        </Col>
                        <Col xs={12}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                            <Text strong style={{ color: '#1890ff' }}>{progressData.breakdown.assignments.passed || 0}</Text>
                            <br />
                            <Text type="secondary">Passed</Text>
                          </Card>
                        </Col>
                      </Row>

                      {/* Action Buttons */}
                      <Divider />
                      <Row justify="center">
                        <Space>
                          <Button 
                            type="primary" 
                            icon={<TrophyOutlined />}
                            onClick={() => {
                              setAssignmentsModalVisible(false);
                              navigate('/assignment-dashboard');
                            }}
                          >
                            View Assignments
                          </Button>
                          <Button 
                            type="default" 
                            icon={<LineChartOutlined />}
                            onClick={() => {
                              setAssignmentsModalVisible(false);
                              navigate('/assignment-history');
                            }}
                          >
                            Assignment History
                          </Button>
                        </Space>
                      </Row>
                    </div>
                  ) : (
                    <Empty description="No assignment data available" />
                  )}
                </Modal>

                {/* Quizzes Detailed Modal */}
                <Modal
                  title={
                    <Space>
                      <QuestionCircleOutlined style={{ color: '#52c41a' }} />
                      <span>Quizzes Details</span>
                    </Space>
                  }
                  open={quizzesModalVisible}
                  onCancel={() => setQuizzesModalVisible(false)}
                  footer={null}
                  width={800}
                >
                  {progressData?.breakdown?.quizzes ? (
                    <div>
                      {/* Overall Progress */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text strong>Overall Quiz Progress</Text>
                          <Text type="secondary">
                            {progressData.breakdown.quizzes.completed || 0} of {progressData.breakdown.quizzes.total || 0} quizzes completed
                          </Text>
                        </div>
                        <Progress
                          percent={progressData.breakdown.quizzes.percentage || 0}
                          status={(progressData.breakdown.quizzes.percentage || 0) >= 80 ? 'success' : 
                                 (progressData.breakdown.quizzes.percentage || 0) >= 50 ? 'active' : 'exception'}
                          strokeWidth={12}
                          format={percent => `${percent}%`}
                        />
                      </div>

                      {/* Detailed Statistics */}
                      <Row gutter={[16, 16]}>
                        <Col xs={12}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
                            <Text strong style={{ color: '#52c41a' }}>{progressData.breakdown.quizzes.completed || 0}</Text>
                            <br />
                            <Text type="secondary">Completed</Text>
                          </Card>
                        </Col>
                        <Col xs={12}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                            <Text strong style={{ color: '#1890ff' }}>{progressData.breakdown.quizzes.passed || 0}</Text>
                            <br />
                            <Text type="secondary">Passed</Text>
                          </Card>
                        </Col>
                      </Row>

                      {/* Action Buttons */}
                      <Divider />
                      <Row justify="center">
                        <Space>
                          <Button 
                            type="primary" 
                            icon={<QuestionCircleOutlined />}
                            onClick={() => {
                              setQuizzesModalVisible(false);
                              navigate('/quiz-dashboard');
                            }}
                          >
                            Take Quizzes
                          </Button>
                          <Button 
                            type="default" 
                            icon={<LineChartOutlined />}
                            onClick={() => {
                              setQuizzesModalVisible(false);
                              navigate('/quiz-history');
                            }}
                          >
                            Quiz History
                          </Button>
                        </Space>
                      </Row>
                    </div>
                  ) : (
                    <Empty description="No quiz data available" />
                  )}
                </Modal>

                {/* Live Classes Detailed Modal */}
                <Modal
                  title={
                    <Space>
                      <VideoCameraOutlined style={{ color: '#faad14' }} />
                      <span>Live Classes Details</span>
                    </Space>
                  }
                  open={liveClassesModalVisible}
                  onCancel={() => setLiveClassesModalVisible(false)}
                  footer={null}
                  width={800}
                >
                  {progressData?.breakdown?.attendance ? (
                    <div>
                      {/* Overall Progress */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text strong>Overall Attendance Progress</Text>
                          <Text type="secondary">
                            {progressData.breakdown.attendance.attended || 0} of {progressData.breakdown.attendance.total || 0} classes attended
                          </Text>
                        </div>
                        <Progress
                          percent={progressData.breakdown.attendance.percentage || 0}
                          status={progressData.breakdown.attendance.percentage >= 80 ? 'success' : 
                                 progressData.breakdown.attendance.percentage >= 50 ? 'active' : 'exception'}
                          strokeWidth={12}
                          format={percent => `${percent}%`}
                        />
                      </div>

                      {/* Detailed Statistics */}
                      <Row gutter={[16, 16]}>
                        <Col xs={8}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
                            <Text strong style={{ color: '#52c41a' }}>{progressData.breakdown.attendance.attended || 0}</Text>
                            <br />
                            <Text type="secondary">Present</Text>
                          </Card>
                        </Col>
                        <Col xs={8}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
                            <Text strong style={{ color: '#faad14' }}>{progressData.breakdown.attendance.partial || 0}</Text>
                            <br />
                            <Text type="secondary">Partial</Text>
                          </Card>
                        </Col>
                        <Col xs={8}>
                          <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff2f0' }}>
                            <Text strong style={{ color: '#ff4d4f' }}>{progressData.breakdown.attendance.absent || 0}</Text>
                            <br />
                            <Text type="secondary">Absent</Text>
                          </Card>
                        </Col>
                      </Row>

                      {/* Attendance Rate */}
                      <Divider />
                      <Row justify="center">
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                            {progressData.breakdown.attendance.percentage || 0}%
                          </Text>
                          <br />
                          <Text type="secondary">Attendance Rate</Text>
                        </Card>
                      </Row>

                      {/* Action Buttons */}
                      <Divider />
                      <Row justify="center">
                        <Space>
                          <Button 
                            type="primary" 
                            icon={<VideoCameraOutlined />}
                            onClick={() => {
                              setLiveClassesModalVisible(false);
                              navigate('/student-dashboard');
                            }}
                          >
                            View Live Classes
                          </Button>
                          <Button 
                            type="default" 
                            icon={<LineChartOutlined />}
                            onClick={() => {
                              setLiveClassesModalVisible(false);
                              navigate('/student-dashboard');
                            }}
                          >
                            Attendance Details
                          </Button>
                        </Space>
                      </Row>
                    </div>
                  ) : (
                    <Empty description="No attendance data available" />
                  )}
                </Modal>
              </>
            ) : (
              <Empty description="No progress data available" />
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProgressTracking;
