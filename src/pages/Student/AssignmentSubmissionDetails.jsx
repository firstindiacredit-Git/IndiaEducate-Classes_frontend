import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Button, 
  Tag, 
  Progress, 
  Statistic, 
  message,
  Badge,
  Space,
  Divider,
  Modal,
  Layout
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;
const { Content } = Layout;

const AssignmentSubmissionDetails = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fetch submission details
  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/submission/${submissionId}`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setSubmission(response.data);
    } catch {
      message.error('Failed to fetch submission details');
      navigate('/assignment-history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

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

  const getStatusBadge = (submission) => {
    const statusConfig = {
      draft: { color: 'default', text: 'Draft' },
      submitted: { color: 'processing', text: 'Submitted' },
      under_review: { color: 'warning', text: 'Under Review' },
      reviewed: { color: 'success', text: 'Reviewed' },
      approved: { color: 'success', text: 'Approved' },
      rejected: { color: 'error', text: 'Rejected' }
    };
    
    const config = statusConfig[submission.status] || { color: 'default', text: submission.status };
    return <Badge status={config.color} text={config.text} />;
  };

  const handlePlayMedia = () => {
    if (submission?.submissionFile?.s3Url) {
      const mediaType = submission.assignment?.type || submission.submissionFile?.fileType;
      setSelectedMedia(submission.submissionFile.s3Url);
      setSelectedMediaType(mediaType);
      setMediaModalVisible(true);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <div style={{ textAlign: 'center' }}>
              <Text>Loading submission details...</Text>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  if (!submission) {
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
            <div style={{ textAlign: 'center' }}>
              <Text>Submission not found</Text>
            </div>
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
              <Space align="center">
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/assignment-history')}
                  style={{
                    fontSize: '16px',
                    marginRight: '8px',
                    padding: 0
                  }}
                />
                <Title level={2} style={{ margin: 0 }}>Submission Details</Title>
              </Space>
              <Space>
                {submission.submissionFile?.s3Url && (
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={handlePlayMedia}
                  >
                    Play Recording
                  </Button>
                )}
                <Button onClick={() => navigate('/assignment-history')}>
                  Back to History
                </Button>
              </Space>
            </Row>

            {/* Assignment Information */}
            <Card title="Assignment Information" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div>
                    <Title level={4}>{submission.assignment?.title}</Title>
                    <Text type="secondary">{submission.assignment?.description}</Text>
                    <div style={{ marginTop: 16 }}>
                      <Space size="large">
                        <Tag color={getSubjectColor(submission.assignment?.subject)}>
                          {submission.assignment?.subject?.replace('_', ' ').toUpperCase()}
                        </Tag>
                        <Tag color={getTypeColor(submission.assignment?.type)} icon={getTypeIcon(submission.assignment?.type)}>
                          {submission.assignment?.type?.toUpperCase()}
                        </Tag>
                        <Text type="secondary">
                          <ClockCircleOutlined /> {submission.assignment?.duration} min
                        </Text>
                      </Space>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: 8 }}>
                      {getStatusBadge(submission)}
                    </div>
                    <div>
                      <Text type="secondary">
                        Submitted: {moment(submission.submittedAt).format('MMM DD, YYYY HH:mm')}
                      </Text>
                    </div>
                    {submission.reviewedAt && (
                      <div>
                        <Text type="secondary">
                          Reviewed: {moment(submission.reviewedAt).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Paragraph to Read */}
            <Card title="Paragraph to Read" style={{ marginBottom: 16 }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '8px',
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                {submission.assignment?.paragraph}
              </div>
            </Card>

            {/* Submission Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={12}>
                <Card title="Submission Details">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Duration"
                        value={formatDuration(submission.duration)}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Attempt"
                        value={submission.attempts}
                        prefix={<TrophyOutlined />}
                      />
                    </Col>
                  </Row>
                  {submission.submissionFile && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>File Information:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>File: {submission.submissionFile.fileName}</Text>
                        <br />
                        <Text>Size: {(submission.submissionFile.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                        <br />
                        <Text>Type: {submission.submissionFile.fileType}</Text>
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="Results">
                  {submission.totalScore > 0 ? (
                    <div>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Total Score"
                            value={submission.totalScore}
                            suffix={`/ ${submission.assignment?.totalMarks}`}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: submission.isPassed ? '#52c41a' : '#ff4d4f' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Percentage"
                            value={Math.round(submission.percentage)}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: submission.isPassed ? '#52c41a' : '#ff4d4f' }}
                          />
                        </Col>
                      </Row>
                      <div style={{ marginTop: 16 }}>
                        <Progress 
                          percent={submission.percentage} 
                          status={submission.isPassed ? 'success' : 'exception'}
                          format={percent => `${percent}%`}
                        />
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Badge 
                          status={submission.isPassed ? 'success' : 'error'} 
                          text={submission.isPassed ? 'Passed' : 'Failed'} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text type="secondary">Not yet reviewed</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Detailed Scores */}
            {submission.scores && submission.totalScore > 0 && (
              <Card title="Detailed Scores" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Pronunciation"
                        value={submission.scores.pronunciation}
                        suffix="/ 25"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Fluency"
                        value={submission.scores.fluency}
                        suffix="/ 25"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Clarity"
                        value={submission.scores.clarity}
                        suffix="/ 25"
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Expression"
                        value={submission.scores.expression}
                        suffix="/ 25"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Feedback */}
            {submission.adminFeedback && (
              <Card title="Feedback from Teacher" style={{ marginBottom: 16 }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f6ffed', 
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>
                  <Text>{submission.adminFeedback}</Text>
                </div>
              </Card>
            )}

            {/* Media Modal */}
            <Modal
              title={`Play ${selectedMediaType === 'audio' ? 'Audio' : 'Video'} Submission`}
              open={mediaModalVisible}
              onCancel={() => {
                setMediaModalVisible(false);
                setSelectedMedia(null);
                setSelectedMediaType(null);
              }}
              footer={null}
              width={700}
            >
              {selectedMedia && selectedMediaType && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary">
                      {selectedMediaType === 'audio' ? 'Audio' : 'Video'} Recording
                    </Text>
                  </div>
                  
                  {selectedMediaType === 'audio' ? (
                    <div>
                      <audio 
                        controls 
                        style={{ width: '100%', height: '60px' }}
                      >
                        <source src={selectedMedia} type="audio/webm" />
                        <source src={selectedMedia} type="audio/mpeg" />
                        <source src={selectedMedia} type="audio/wav" />
                        <source src={selectedMedia} type="audio/mp4" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <div>
                      <video 
                        controls 
                        style={{ width: '100%', maxHeight: '400px', border: '1px solid #d9d9d9' }}
                      >
                        <source src={selectedMedia} type="video/webm" />
                        <source src={selectedMedia} type="video/mp4" />
                        <source src={selectedMedia} type="video/avi" />
                        Your browser does not support the video element.
                      </video>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '16px' }}>
                    <Space>
                      <Button 
                        type="primary" 
                        onClick={() => {
                          setMediaModalVisible(false);
                          setSelectedMedia(null);
                          setSelectedMediaType(null);
                        }}
                      >
                        Close
                      </Button>
                      <Button 
                        type="default"
                        onClick={() => window.open(selectedMedia, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                      <Button 
                        type="default"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedMedia;
                          link.download = `submission.${selectedMediaType === 'audio' ? 'webm' : 'mp4'}`;
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AssignmentSubmissionDetails; 