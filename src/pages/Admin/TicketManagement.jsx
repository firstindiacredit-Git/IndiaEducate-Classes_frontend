import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Descriptions,
  Divider,
  Alert,
  Avatar,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Tooltip,
  Pagination
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TicketManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pageSize: 20
  });

  // Fetch tickets
  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: pagination.pageSize,
        ...filters
      });

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/tickets/admin/tickets?${params}`);
      setTickets(response.data.tickets);
      setPagination(prev => ({
        ...prev,
        current: response.data.pagination.current,
        total: response.data.pagination.totalTickets
      }));
    } catch (err) {
      console.error('Error fetching tickets:', err);
      message.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/tickets/admin/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters]);

  // Handle status update
  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/tickets/admin/ticket/${ticketId}/status`, {
        status: newStatus,
        adminId: profile._id
      });

      message.success('Status updated successfully');
      fetchTickets(pagination.current);
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
      message.error('Failed to update status');
    }
  };

  // Handle admin response
  const handleAdminResponse = async (values) => {
    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/tickets/admin/ticket/${selectedTicket.ticketId}/respond`, {
        message: values.response,
        adminId: profile._id
      });

      message.success('Response added successfully');
      setResponseModalVisible(false);
      form.resetFields();
      fetchTickets(pagination.current);
      fetchStats();
    } catch (err) {
      console.error('Error adding response:', err);
      message.error('Failed to add response');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'blue';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'red';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <ClockCircleOutlined />;
      case 'in_progress': return <ExclamationCircleOutlined />;
      case 'resolved': return <CheckCircleOutlined />;
      case 'closed': return <CloseCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketId',
      key: 'ticketId',
      render: (text) => <Text code>{text}</Text>,
      width: 120,
    },
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.studentId?.profilePicture}
            icon={<UserOutlined />}
            size="small"
          />
          <div>
            <div>{record.studentId?.fullName || 'N/A'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.studentId?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category.charAt(0).toUpperCase() + category.slice(1)}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('MMM DD, YYYY'),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTicket(record);
              setModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status !== 'closed' && (
            <Button
              type="link"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedTicket(record);
                setResponseModalVisible(true);
              }}
            >
              Respond
            </Button>
          )}
        </Space>
      ),
      width: 150,
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavbar />

      <div style={{ maxWidth: 1400, margin: '24px auto', padding: '0 24px' }}>
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
            <Title level={2} style={{ margin: 0 }}>Ticket Management</Title>
          </Space>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchTickets();
              fetchStats();
            }}
          >
            Refresh
          </Button>
        </Row>

        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Tickets"
                value={stats.totalTickets || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Open Tickets"
                value={stats.openTickets || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Urgent Tickets"
                value={stats.urgentTickets || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Resolved"
                value={stats.statusStats?.find(s => s._id === 'resolved')?.count || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Select
                placeholder="Filter by Status"
                style={{ width: '100%' }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="open">Open</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="resolved">Resolved</Option>
                <Option value="closed">Closed</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                placeholder="Filter by Category"
                style={{ width: '100%' }}
                allowClear
                value={filters.category}
                onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <Option value="technical">Technical</Option>
                <Option value="academic">Academic</Option>
                <Option value="payment">Payment</Option>
                <Option value="other">Other</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                placeholder="Filter by Priority"
                style={{ width: '100%' }}
                allowClear
                value={filters.priority}
                onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <Option value="urgent">Urgent</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Tickets Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="_id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
          />

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={pagination.current}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onChange={fetchTickets}
              showSizeChanger={false}
              showQuickJumper
            />
          </div>
        </Card>

        {/* Ticket Details Modal */}
        <Modal
          title="Ticket Details"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedTicket(null);
          }}
          footer={null}
          width={800}
        >
          {selectedTicket && (
            <div>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Ticket ID" span={2}>
                  <Text code>{selectedTicket.ticketId}</Text>
                </Descriptions.Item>

                <Descriptions.Item label="Student Name">
                  {selectedTicket.studentId?.fullName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedTicket.studentId?.email || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Phone">
                  {selectedTicket.studentId?.phone || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Enrollment ID">
                  {selectedTicket.studentId?.enrollmentId || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Program">
                  {selectedTicket.studentId?.program || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Country">
                  {selectedTicket.studentId?.country || 'N/A'}
                </Descriptions.Item>

                <Descriptions.Item label="Subject">
                  {selectedTicket.subject}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">
                    {selectedTicket.category.charAt(0).toUpperCase() + selectedTicket.category.slice(1)}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Priority">
                  <Tag color={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedTicket.status)} icon={getStatusIcon(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ').charAt(0).toUpperCase() + selectedTicket.status.replace('_', ' ').slice(1)}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Created">
                  {moment(selectedTicket.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  <Text>{selectedTicket.description}</Text>
                </Descriptions.Item>
              </Descriptions>

              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <>
                  <Divider />
                  <Title level={5}>Attachments</Title>
                  <Space direction="vertical">
                    {selectedTicket.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileTextOutlined /> {attachment.filename}
                      </a>
                    ))}
                  </Space>
                </>
              )}

              {selectedTicket.adminResponse && (
                <>
                  <Divider />
                  <Title level={5}>Admin Response</Title>
                  <Alert
                    message={`Response from ${selectedTicket.adminResponse.respondedBy?.fullName || 'Admin'}`}
                    description={
                      <div>
                        <Text>{selectedTicket.adminResponse.message}</Text>
                        <br />
                        <Text type="secondary">
                          {moment(selectedTicket.adminResponse.respondedAt).format('MMMM DD, YYYY [at] h:mm A')}
                        </Text>
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                </>
              )}

              {selectedTicket.status !== 'closed' && (
                <>
                  <Divider />
                  <Space>
                    <Button
                      type="primary"
                      onClick={() => setResponseModalVisible(true)}
                    >
                      Add Response
                    </Button>
                    <Select
                      placeholder="Update Status"
                      style={{ width: 200 }}
                      onChange={(value) => handleStatusUpdate(selectedTicket.ticketId, value)}
                    >
                      <Option value="open">Open</Option>
                      <Option value="in_progress">In Progress</Option>
                      <Option value="resolved">Resolved</Option>
                      <Option value="closed">Closed</Option>
                    </Select>
                  </Space>
                </>
              )}
            </div>
          )}
        </Modal>

        {/* Admin Response Modal */}
        <Modal
          title="Add Admin Response"
          open={responseModalVisible}
          onCancel={() => {
            setResponseModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAdminResponse}
          >
            <Form.Item
              name="response"
              label="Response"
              rules={[{ required: true, message: 'Please enter your response' }]}
            >
              <TextArea
                rows={4}
                placeholder="Enter your response to the student..."
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Send Response
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default TicketManagement;
