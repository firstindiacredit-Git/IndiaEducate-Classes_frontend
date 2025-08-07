import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Space, 
  message, 
  Popconfirm,
  Divider,
  Statistic,
  Progress,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const QuizManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // Helper function to get default dates
  const getDefaultDates = () => {
    const now = moment();
    return {
      startDate: now,
      endDate: now.add(7, 'days') // Quiz available for 7 days
    };
  };
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    activeQuizzes: 0,
    publishedQuizzes: 0,
    totalSubmissions: 0
  });

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/all`);
      setQuizzes(response.data);
      
      // Calculate stats
      const activeQuizzes = response.data.filter(q => q.isActive).length;
      const publishedQuizzes = response.data.filter(q => q.isPublished).length;
      
      setStats({
        totalQuizzes: response.data.length,
        activeQuizzes,
        publishedQuizzes,
        totalSubmissions: 0 // Will be calculated separately
      });
    } catch (err) {
      message.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCreateQuiz = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        adminEmailOrPhone: localStorage.getItem('adminEmailOrPhone') || profile?.email
      };

      if (editingQuiz) {
        await axios.put(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${editingQuiz._id}`, payload);
        message.success('Quiz updated successfully');
      } else {
        await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/create`, payload);
        message.success('Quiz created successfully');
        message.info('Students have been notified about the new quiz.');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingQuiz(null);
      fetchQuizzes();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    form.setFieldsValue({
      ...quiz,
      startDate: moment(quiz.startDate),
      endDate: moment(quiz.endDate),
      assignedTo: quiz.assignedTo?.map(s => s._id) || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (quizId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${quizId}`, {
        data: { adminEmailOrPhone: localStorage.getItem('adminEmailOrPhone') || profile?.email }
      });
      message.success('Quiz deleted successfully');
      fetchQuizzes();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

    const handlePublish = async (quizId, isPublished) => {
    try {
      const adminEmailOrPhone = localStorage.getItem('adminEmailOrPhone') || profile?.email;
      await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${quizId}/publish`, {
        isPublished,
        adminEmailOrPhone
      });
      message.success(`Quiz ${isPublished ? 'published' : 'unpublished'} successfully`);
      fetchQuizzes();
    } catch (err) {
      message.error('Failed to update quiz status');
    }
  };

  const handleMakeAvailable = async (quizId) => {
    try {
      const adminEmailOrPhone = localStorage.getItem('adminEmailOrPhone') || profile?.email;
      const now = new Date();
      const endDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
      
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/admin/quizzes/${quizId}`, {
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        adminEmailOrPhone
      });
      message.success('Quiz is now available for students');
      fetchQuizzes();
    } catch (err) {
      message.error('Failed to make quiz available');
    }
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

  const getTypeColor = (type) => {
    const colors = {
      weekly_test: 'red',
      assignment: 'blue',
      practice_quiz: 'green'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description.substring(0, 50)}...
          </Text>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (subject) => (
        <Tag color={getSubjectColor(subject)}>
          {subject.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} min`
    },
    {
      title: 'Marks',
      key: 'marks',
      render: (_, record) => (
        <div>
          <div>Total: {record.totalMarks}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Pass: {record.passingMarks}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Badge 
            status={record.isActive ? 'success' : 'default'} 
            text={record.isActive ? 'Active' : 'Inactive'} 
          />
          <Badge 
            status={record.isPublished ? 'processing' : 'default'} 
            text={record.isPublished ? 'Published' : 'Draft'} 
          />
        </Space>
      )
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            Start: {moment(record.startDate).format('MMM DD, YYYY')}
          </div>
          <div style={{ fontSize: '12px' }}>
            End: {moment(record.endDate).format('MMM DD, YYYY')}
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type={record.isPublished ? 'default' : 'primary'}
            size="small"
            onClick={() => handlePublish(record._id, !record.isPublished)}
          >
            {record.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button 
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/quiz-submissions/${record._id}`)}
          >
            Submissions
          </Button>
          <Button 
            type="default"
            size="small"
            onClick={() => handleMakeAvailable(record._id)}
            style={{ marginLeft: 8 }}
          >
            Make Available
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this quiz?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Space align="center">
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin-dashboard')}
              style={{
                fontSize: '16px',
                marginRight: '8px',
                padding: 0
              }}
            />
            <Title level={2} style={{ margin: 0 }}>Quiz Management</Title>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingQuiz(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Quiz
          </Button>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Quizzes"
                value={stats.totalQuizzes}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Quizzes"
                value={stats.activeQuizzes}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Published Quizzes"
                value={stats.publishedQuizzes}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Submissions"
                value={stats.totalSubmissions}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Quizzes Table */}
        <Card title="All Quizzes" loading={loading}>
          <Table
            columns={columns}
            dataSource={quizzes}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true
            }}
          />
        </Card>

        {/* Create/Edit Quiz Modal */}
        <Modal
          title={editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingQuiz(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateQuiz}
            initialValues={{
              type: 'weekly_test',
              subject: 'english',
              language: 'english',
              duration: 30,
              totalMarks: 100,
              passingMarks: 40,
              ...getDefaultDates()
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Quiz Title"
                  rules={[{ required: true, message: 'Please enter quiz title' }]}
                >
                  <Input placeholder="Enter quiz title" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Quiz Type"
                  rules={[{ required: true, message: 'Please select quiz type' }]}
                >
                  <Select>
                    <Option value="weekly_test">Weekly Test</Option>
                    <Option value="assignment">Assignment</Option>
                    <Option value="practice_quiz">Practice Quiz</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={3} placeholder="Enter quiz description" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[{ required: true, message: 'Please select subject' }]}
                >
                  <Select>
                    <Option value="english">English</Option>
                    <Option value="hindi">Hindi</Option>
                    <Option value="mathematics">Mathematics</Option>
                    <Option value="science">Science</Option>
                    <Option value="social_studies">Social Studies</Option>
                    <Option value="general_knowledge">General Knowledge</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="language"
                  label="Language"
                  rules={[{ required: true, message: 'Please select language' }]}
                >
                  <Select>
                    <Option value="english">English</Option>
                    <Option value="hindi">Hindi</Option>
                    <Option value="both">Both</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="duration"
                  label="Duration (minutes)"
                  rules={[{ required: true, message: 'Please enter duration' }]}
                >
                  <InputNumber min={5} max={180} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="totalMarks"
                  label="Total Marks"
                  rules={[{ required: true, message: 'Please enter total marks' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="passingMarks"
                  label="Passing Marks"
                  rules={[{ required: true, message: 'Please enter passing marks' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="weekNumber"
                  label="Week Number (for weekly tests)"
                >
                  <InputNumber min={1} max={52} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  rules={[{ required: true, message: 'Please select start date' }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="End Date"
                  rules={[{ required: true, message: 'Please select end date' }]}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Questions</Divider>
            
            <Form.List name="questions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginBottom: 16 }}>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, 'question']}
                            label="Question"
                            rules={[{ required: true, message: 'Please enter question' }]}
                          >
                            <TextArea rows={2} placeholder="Enter question" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            label="Question Type"
                            rules={[{ required: true, message: 'Please select type' }]}
                          >
                            <Select>
                              <Option value="multiple_choice">Multiple Choice</Option>
                              <Option value="true_false">True/False</Option>
                              <Option value="fill_blank">Fill in the Blank</Option>
                              <Option value="short_answer">Short Answer</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'marks']}
                            label="Marks"
                            rules={[{ required: true, message: 'Please enter marks' }]}
                          >
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Button 
                            type="text" 
                            danger 
                            onClick={() => remove(name)}
                            style={{ marginTop: 32 }}
                          >
                            Remove Question
                          </Button>
                        </Col>
                      </Row>

                      <Form.Item
                        {...restField}
                        name={[name, 'correctAnswer']}
                        label="Correct Answer"
                        rules={[{ required: true, message: 'Please enter correct answer' }]}
                      >
                        <Input placeholder="Enter correct answer" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'options']}
                        label="Options (for multiple choice)"
                      >
                        <Select mode="tags" placeholder="Enter options" />
                      </Form.Item>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block>
                      Add Question
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </Button>
                <Button onClick={() => {
                  setModalVisible(false);
                  setEditingQuiz(null);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default QuizManagement; 