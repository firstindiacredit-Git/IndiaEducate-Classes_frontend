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
  AudioOutlined,
  VideoCameraOutlined,
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

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [form] = Form.useForm();
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);

  // Fetch assignment details and submissions
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch assignment details
      const assignmentResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/${assignmentId}`);
      setAssignment(assignmentResponse.data);

      // Fetch submissions
      const submissionsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/${assignmentId}/submissions`);
      setSubmissions(submissionsResponse.data);

      // Fetch statistics
      const statsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/${assignmentId}/statistics`);
      setStats(statsResponse.data);
    } catch (err) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const handleReview = (submission) => {
    setSelectedSubmission(submission);
    form.setFieldsValue({
      adminFeedback: submission.adminFeedback || '',
      adminComments: submission.adminComments || '',
      pronunciation: submission.scores?.pronunciation || 0,
      fluency: submission.scores?.fluency || 0,
      clarity: submission.scores?.clarity || 0,
      expression: submission.scores?.expression || 0
    });
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    try {
      const emailOrPhone = localStorage.getItem('adminEmailOrPhone') || profile?.email;
      await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/submission/${selectedSubmission._id}/review`, {
        adminFeedback: values.adminFeedback,
        adminComments: values.adminComments,
        scores: {
          pronunciation: values.pronunciation,
          fluency: values.fluency,
          clarity: values.clarity,
          expression: values.expression
        },
        status: 'reviewed',
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

  const getTypeIcon = (type) => {
    return type === 'audio' ? <AudioOutlined /> : <VideoCameraOutlined />;
  };

  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.student?.fullName}</div>
          <Text type="secondary">{record.student?.email}</Text>
        </div>
      )
    },
    {
      title: 'Submission',
      key: 'submission',
      render: (_, record) => (
        <div>
          <div>
            {getTypeIcon(record.assignment?.type)} {record.assignment?.type?.toUpperCase()}
          </div>
          {record.submissionFile?.fileName && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              File: {record.submissionFile.fileName}
            </div>
          )}
          {record.duration > 0 && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Duration: {Math.floor(record.duration / 60)}:{(record.duration % 60).toString().padStart(2, '0')}
            </div>
          )}
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
              onClick={() => {

                // Use assignment type or fallback to file type
                const mediaType = record.assignment?.type || record.submissionFile?.fileType;

                setSelectedMedia(record.submissionFile.s3Url);
                setSelectedMediaType(mediaType);
                setMediaModalVisible(true);
              }}
            >
              Play
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleReview(record)}
          >
            Review
          </Button>
        </Space>
      )
    }
  ];

  if (loading) {
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
            minHeight: 'calc(100vh - 112px)',
            textAlign: 'center'
          }}>
            <Text>Loading submissions...</Text>
          </Content>
        </Layout>
      </Layout>
    );
  }

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
          {/* Header */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Assignment Submissions
              </Title>
              {assignment && (
                <Text type="secondary">
                  {assignment.title} - {assignment.type.toUpperCase()}
                </Text>
              )}
            </div>
            <Button onClick={() => navigate('/assignment-management')}>
              Back to Assignments
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
                  title="Submitted"
                  value={stats.submittedSubmissions || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Reviewed"
                  value={stats.reviewedSubmissions || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Passed"
                  value={stats.passedSubmissions || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Submissions Table */}
          <Card title="All Submissions" loading={loading}>
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
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmitReview}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="pronunciation"
                      label="Pronunciation (0-25)"
                      rules={[{ required: true, message: 'Please enter pronunciation score' }]}
                    >
                      <InputNumber min={0} max={25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="fluency"
                      label="Fluency (0-25)"
                      rules={[{ required: true, message: 'Please enter fluency score' }]}
                    >
                      <InputNumber min={0} max={25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="clarity"
                      label="Clarity (0-25)"
                      rules={[{ required: true, message: 'Please enter clarity score' }]}
                    >
                      <InputNumber min={0} max={25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="expression"
                      label="Expression (0-25)"
                      rules={[{ required: true, message: 'Please enter expression score' }]}
                    >
                      <InputNumber min={0} max={25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Form.Item
                  name="adminFeedback"
                  label="Feedback"
                >
                  <TextArea rows={3} placeholder="Enter feedback for the student..." />
                </Form.Item>

                <Form.Item
                  name="adminComments"
                  label="Comments (Internal)"
                >
                  <TextArea rows={2} placeholder="Enter internal comments..." />
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
            )}
          </Modal>

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
                  {/* <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    URL: {selectedMedia}
                  </div> */}
                </div>

                {selectedMediaType === 'audio' ? (
                  <div>
                    <audio
                      controls
                      style={{ width: '100%', height: '60px' }}
                      onError={(e) => console.error('Audio error:', e)}
                    >
                      <source src={selectedMedia} type="audio/webm" />
                      <source src={selectedMedia} type="audio/mpeg" />
                      <source src={selectedMedia} type="audio/wav" />
                      <source src={selectedMedia} type="audio/mp4" />
                      Your browser does not support the audio element.
                    </audio>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      If audio doesn't play, try downloading the file
                    </div>
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
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      If video doesn't play, try downloading the file
                    </div>
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default AssignmentSubmissions; 