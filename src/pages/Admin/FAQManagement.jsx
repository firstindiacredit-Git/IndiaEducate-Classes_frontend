import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
  Alert,
  Empty,
  Spin,
  Tooltip,
  Layout
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  TrophyOutlined,
  UserOutlined,
  SettingOutlined,
  StarOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;

const FAQManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalFAQs, setTotalFAQs] = useState(0);

  // Category options
  const categoryOptions = [
    { value: 'general', label: 'General Questions', icon: <QuestionCircleOutlined /> },
    { value: 'classes', label: 'Classes & Attendance', icon: <VideoCameraOutlined /> },
    { value: 'assignments', label: 'Assignments & Quizzes', icon: <FileTextOutlined /> },
    { value: 'materials', label: 'Study Materials & Files', icon: <BookOutlined /> },
    { value: 'progress', label: 'Progress & Certificates', icon: <TrophyOutlined /> },
    { value: 'technical', label: 'Technical Issues', icon: <SettingOutlined /> },
    { value: 'account', label: 'Account & Profile', icon: <UserOutlined /> },
    { value: 'support', label: 'Support & Contact', icon: <QuestionCircleOutlined /> }
  ];

  // Fetch FAQs
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      };

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/faq/admin/all`, {
        params,
        headers: {
          'admin-email': localStorage.getItem('adminEmailOrPhone'),
          'admin-phone': localStorage.getItem('adminEmailOrPhone')
        }
      });

      setFaqs(response.data.faqs);
      setTotalFAQs(response.data.pagination.totalFAQs);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      message.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/faq/admin/stats`, {
        headers: {
          'admin-email': localStorage.getItem('adminEmailOrPhone'),
          'admin-phone': localStorage.getItem('adminEmailOrPhone')
        }
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchFAQs();
    fetchStats();
  }, [currentPage, pageSize, searchText, categoryFilter]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Ensure priority is a number
      const formData = {
        ...values,
        priority: parseInt(values.priority) || 0
      };

      if (editingFAQ) {
        // Update existing FAQ
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/faq/admin/${editingFAQ._id}`,
          formData,
          {
            headers: {
              'admin-email': localStorage.getItem('adminEmailOrPhone'),
              'admin-phone': localStorage.getItem('adminEmailOrPhone')
            }
          }
        );
        message.success('FAQ updated successfully');
      } else {
        // Create new FAQ
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/faq/admin/create`,
          formData,
          {
            headers: {
              'admin-email': localStorage.getItem('adminEmailOrPhone'),
              'admin-phone': localStorage.getItem('adminEmailOrPhone')
            }
          }
        );
        message.success('FAQ created successfully');
      }

      setModalVisible(false);
      setEditingFAQ(null);
      form.resetFields();
      fetchFAQs();
      fetchStats();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      message.error(err.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (faq) => {
    setEditingFAQ(faq);
    form.setFieldsValue({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority,
      tags: faq.tags,
      isActive: faq.isActive
    });
    setModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/faq/admin/${id}`, {
        headers: {
          'admin-email': localStorage.getItem('adminEmailOrPhone'),
          'admin-phone': localStorage.getItem('adminEmailOrPhone')
        }
      });
      message.success('FAQ deleted successfully');
      fetchFAQs();
      fetchStats();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      message.error('Failed to delete FAQ');
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.icon : <QuestionCircleOutlined />;
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      general: 'blue',
      classes: 'green',
      assignments: 'orange',
      materials: 'purple',
      progress: 'gold',
      technical: 'red',
      account: 'cyan',
      support: 'magenta'
    };
    return colors[category] || 'default';
  };

  // Table columns
  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (text) => (
        <Text style={{ maxWidth: 300 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={getCategoryColor(category)} icon={getCategoryIcon(category)}>
          {categoryOptions.find(opt => opt.value === category)?.label || category}
        </Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority >= 7 ? 'red' : priority >= 4 ? 'orange' : 'green'}>
          {priority}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Views',
      dataIndex: 'viewCount',
      key: 'viewCount',
      render: (count) => <Text>{count || 0}</Text>
    },
    {
      title: 'Helpful',
      dataIndex: 'helpfulCount',
      key: 'helpfulCount',
      render: (count) => <Text>{count || 0}</Text>
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View FAQ">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: record.question,
                  content: (
                    <div>
                      <Paragraph>{record.answer}</Paragraph>
                      <Space>
                        <Tag color={getCategoryColor(record.category)}>
                          {categoryOptions.find(opt => opt.value === record.category)?.label}
                        </Tag>
                        <Text type="secondary">
                          Views: {record.viewCount || 0} | Helpful: {record.helpfulCount || 0}
                        </Text>
                      </Space>
                    </div>
                  ),
                  width: 600
                });
              }}
            />
          </Tooltip>
          <Tooltip title="Edit FAQ">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this FAQ?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete FAQ">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

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
              <Title level={2} style={{ margin: 0 }}> <QuestionCircleOutlined style={{ marginRight: '8px' }} />
                FAQ Management
                </Title>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingFAQ(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Create FAQ
            </Button>
          </Row>

          {/* Statistics */}
          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={6}>
                <Card>
                  <Statistic
                    title="Total FAQs"
                    value={stats.totalFAQs}
                    prefix={<QuestionCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card>
                  <Statistic
                    title="Active FAQs"
                    value={stats.activeFAQs}
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card>
                  <Statistic
                    title="Total Views"
                    value={stats.totalViews}
                    prefix={<EyeOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card>
                  <Statistic
                    title="Total Helpful"
                    value={stats.totalHelpful || 0}
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Filters and Actions */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Search FAQs..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  placeholder="Filter by category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Categories</Option>
                  {categoryOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={4}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setCategoryFilter('all');
                    setCurrentPage(1);
                  }}
                  block
                >
                  Reset
                </Button>
              </Col>
              <Col xs={24} sm={6}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingFAQ(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                  block
                >
                  Add New FAQ
                </Button>
              </Col>
            </Row>
          </Card>

          {/* FAQs Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={faqs}
              rowKey="_id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalFAQs,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} FAQs`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }
              }}
              scroll={{ x: 1200 }}
            />
          </Card>

          {/* Add/Edit FAQ Modal */}
          <Modal
            title={
              <Space>
                {editingFAQ ? <EditOutlined /> : <PlusOutlined />}
                <span>{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</span>
              </Space>
            }
            open={modalVisible}
            onCancel={() => {
              setModalVisible(false);
              setEditingFAQ(null);
              form.resetFields();
            }}
            footer={null}
            width={800}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                category: 'general',
                priority: 0,
                isActive: true,
                tags: []
              }}
            >
              <Form.Item
                name="question"
                label="Question"
                rules={[{ required: true, message: 'Please enter the question' }]}
              >
                <Input placeholder="Enter the question..." />
              </Form.Item>

              <Form.Item
                name="answer"
                label="Answer"
                rules={[{ required: true, message: 'Please enter the answer' }]}
              >
                <TextArea
                  rows={6}
                  placeholder="Enter the detailed answer..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select a category' }]}
                  >
                    <Select placeholder="Select category">
                      {categoryOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label="Priority (0-10)"
                    rules={[
                      { required: true, message: 'Please enter priority' },
                      {
                        validator: (_, value) => {
                          const numValue = parseInt(value);
                          if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                            return Promise.reject(new Error('Priority must be between 0 and 10'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input type="number" min={0} max={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="tags"
                label="Tags (Optional)"
              >
                <Select
                  mode="tags"
                  placeholder="Add tags..."
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
              >
                <Select>
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={editingFAQ ? <EditOutlined /> : <PlusOutlined />}
                  >
                    {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                  </Button>
                  <Button
                    onClick={() => {
                      setModalVisible(false);
                      setEditingFAQ(null);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default FAQManagement;
