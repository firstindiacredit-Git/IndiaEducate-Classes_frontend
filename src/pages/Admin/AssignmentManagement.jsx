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
  Badge,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  AudioOutlined,
  VideoCameraOutlined
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

const AssignmentManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // Helper function to get default dates
  const getDefaultDates = () => {
    const now = moment();
    return {
      startDate: now,
      endDate: now.add(7, 'days') // Assignment available for 7 days
    };
  };
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeAssignments: 0,
    publishedAssignments: 0,
    totalSubmissions: 0
  });

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/all`);
      setAssignments(response.data);
      
      // Calculate stats
      const activeAssignments = response.data.filter(a => a.isActive).length;
      const publishedAssignments = response.data.filter(a => a.isPublished).length;
      
      setStats({
        totalAssignments: response.data.length,
        activeAssignments,
        publishedAssignments,
        totalSubmissions: 0 // Will be calculated separately
      });
    } catch (err) {
      message.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        adminEmailOrPhone: localStorage.getItem('adminEmailOrPhone') || profile?.email
      };

      if (editingAssignment) {
        await axios.put(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/${editingAssignment._id}`, payload);
        message.success('Assignment updated successfully');
      } else {
        await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/create`, payload);
        message.success('Assignment created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingAssignment(null);
      fetchAssignments();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    form.setFieldsValue({
      ...assignment,
      startDate: moment(assignment.startDate),
      endDate: moment(assignment.endDate),
      assignedTo: assignment.assignedTo?.map(s => s._id) || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (assignmentId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/${assignmentId}`, {
        data: { adminEmailOrPhone: localStorage.getItem('adminEmailOrPhone') || profile?.email }
      });
      message.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handlePublish = async (assignmentId, isPublished) => {
    try {
      const adminEmailOrPhone = localStorage.getItem('adminEmailOrPhone') || profile?.email;
      await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/admin/assignments/${assignmentId}/publish`, {
        isPublished,
        adminEmailOrPhone
      });
      message.success(`Assignment ${isPublished ? 'published' : 'unpublished'} successfully`);
      fetchAssignments();
    } catch (err) {
      message.error('Failed to update assignment status');
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

  const getTypeIcon = (type) => {
    return type === 'audio' ? <AudioOutlined /> : <VideoCameraOutlined />;
  };

  const getTypeColor = (type) => {
    return type === 'audio' ? 'green' : 'blue';
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
        <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
          {type.toUpperCase()}
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
            onClick={() => navigate(`/assignment-submissions/${record._id}`)}
          >
            Submissions
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this assignment?"
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
            <Title level={2} style={{ margin: 0 }}>Assignment Management</Title>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAssignment(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Assignment
          </Button>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Assignments"
                value={stats.totalAssignments}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Assignments"
                value={stats.activeAssignments}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Published Assignments"
                value={stats.publishedAssignments}
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

        {/* Assignments Table */}
        <Card title="All Assignments" loading={loading}>
          <Table
            columns={columns}
            dataSource={assignments}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true
            }}
          />
        </Card>

        {/* Create/Edit Assignment Modal */}
        <Modal
          title={editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingAssignment(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateAssignment}
            initialValues={{
              type: 'audio',
              subject: 'english',
              language: 'english',
              duration: 5,
              maxFileSize: 100,
              totalMarks: 100,
              passingMarks: 40,
              rubric: {
                pronunciation: 25,
                fluency: 25,
                clarity: 25,
                expression: 25
              },
              ...getDefaultDates()
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Assignment Title"
                  rules={[{ required: true, message: 'Please enter assignment title' }]}
                >
                  <Input placeholder="Enter assignment title" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Assignment Type"
                  rules={[{ required: true, message: 'Please select assignment type' }]}
                >
                  <Select>
                    <Option value="audio">Audio Recording</Option>
                    <Option value="video">Video Recording</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={3} placeholder="Enter assignment description" />
            </Form.Item>

            <Form.Item
              name="paragraph"
              label="Paragraph to Read"
              rules={[{ required: true, message: 'Please enter paragraph for students to read' }]}
            >
              <TextArea rows={6} placeholder="Enter the paragraph that students need to read and record..." />
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
                  <InputNumber min={1} max={60} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="maxFileSize"
                  label="Max File Size (MB)"
                  rules={[{ required: true, message: 'Please enter max file size' }]}
                >
                  <InputNumber min={1} max={500} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
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

            <Form.Item
              name="instructions"
              label="Instructions (Optional)"
            >
              <TextArea rows={3} placeholder="Enter additional instructions for students..." />
            </Form.Item>

            <Divider>Evaluation Rubric</Divider>
            
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name={['rubric', 'pronunciation']}
                  label="Pronunciation (25)"
                  rules={[{ required: true, message: 'Please enter pronunciation marks' }]}
                >
                  <InputNumber min={0} max={25} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['rubric', 'fluency']}
                  label="Fluency (25)"
                  rules={[{ required: true, message: 'Please enter fluency marks' }]}
                >
                  <InputNumber min={0} max={25} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['rubric', 'clarity']}
                  label="Clarity (25)"
                  rules={[{ required: true, message: 'Please enter clarity marks' }]}
                >
                  <InputNumber min={0} max={25} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['rubric', 'expression']}
                  label="Expression (25)"
                  rules={[{ required: true, message: 'Please enter expression marks' }]}
                >
                  <InputNumber min={0} max={25} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button onClick={() => {
                  setModalVisible(false);
                  setEditingAssignment(null);
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

export default AssignmentManagement; 