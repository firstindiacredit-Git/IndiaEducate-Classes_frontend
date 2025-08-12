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
  Modal
} from 'antd';
import { 
  HistoryOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  EyeOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;

const AssignmentHistory = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Fetch assignment history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/history`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setSubmissions(response.data);
    } catch (err) {
      message.error('Failed to fetch assignment history');
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

  const handleViewDetails = (submission) => {
    navigate(`/assignment-submission-details/${submission._id}`);
  };

  const handlePlayMedia = (submission) => {
    if (submission.submissionFile?.s3Url) {
      const mediaType = submission.assignment?.type || submission.submissionFile?.fileType;
      setSelectedMedia(submission.submissionFile.s3Url);
      setSelectedMediaType(mediaType);
      setMediaModalVisible(true);
    }
  };

  const getStats = () => {
    const total = submissions.length;
    const passed = submissions.filter(s => s.isPassed).length;
    const reviewed = submissions.filter(s => s.status === 'reviewed' || s.status === 'approved' || s.status === 'rejected').length;
    const averageScore = reviewed > 0 ? 
      submissions.filter(s => s.status === 'reviewed' || s.status === 'approved' || s.status === 'rejected')
        .reduce((sum, s) => sum + s.percentage, 0) / reviewed : 0;

    return { total, passed, reviewed, averageScore };
  };

  const stats = getStats();

  const columns = [
    {
      title: 'Assignment',
      key: 'assignment',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.assignment?.title}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.assignment?.subject?.replace('_', ' ').toUpperCase()}
          </Text>
          <div style={{ marginTop: '4px' }}>
            <Tag color={getTypeColor(record.assignment?.type)} icon={getTypeIcon(record.assignment?.type)}>
              {record.assignment?.type?.toUpperCase()}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusBadge(record)
    },
    {
      title: 'Score',
      key: 'score',
      render: (_, record) => (
        <div>
          {record.totalScore > 0 ? (
            <>
              <div style={{ fontWeight: 'bold' }}>{record.totalScore}/{record.assignment?.totalMarks}</div>
              <Progress 
                percent={record.percentage} 
                size="small" 
                status={record.isPassed ? 'success' : 'exception'}
              />
            </>
          ) : (
            <Text type="secondary">Not scored</Text>
          )}
        </div>
      )
    },
    {
      title: 'Submitted',
      key: 'submittedAt',
      render: (_, record) => (
        <div>
          <div>{moment(record.submittedAt).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {moment(record.submittedAt).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.submissionFile?.s3Url && (
            <Button 
              type="default" 
              size="small" 
              icon={<PlayCircleOutlined />}
              onClick={() => handlePlayMedia(record)}
            >
              Play
            </Button>
          )}
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StudentNavbar />
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ maxWidth: '1900px', margin: '24px auto', padding: '0 24px', marginLeft: sidebarCollapsed ? '80px' : '250px', transition: 'margin-left 0.2s ease', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Assignment History
            </Title>
            <Text type="secondary">
              View all your assignment submissions and results
            </Text>
          </div>
          <Button onClick={() => navigate('/assignment-dashboard')}>
            Back to Dashboard
          </Button>
        </Row>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Submissions"
                value={stats.total}
                prefix={<HistoryOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Reviewed"
                value={stats.reviewed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Passed"
                value={stats.passed}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={Math.round(stats.averageScore)}
                suffix="%"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Submissions Table */}
        <Card title="All Submissions" loading={loading}>
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <HistoryOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <Text type="secondary">No assignment submissions found</Text>
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
    </div>
  );
};

export default AssignmentHistory; 