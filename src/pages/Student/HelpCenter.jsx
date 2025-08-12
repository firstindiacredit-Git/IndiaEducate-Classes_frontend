import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Upload, 
  message, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  Descriptions,
  Divider,
  Alert,
  Spin,
  Empty,
  Row,
  Col,
  Layout
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined, 
  EyeOutlined, 
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Content } = Layout;

const HelpCenter = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fetch student's tickets
  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/tickets/student-tickets`, {
        emailOrPhone: profile?.email || profile?.phone
      });
      setTickets(response.data.tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      message.error('Failed to fetch tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchTickets();
    }
  }, [profile]);

  // Handle ticket creation
  const handleCreateTicket = async (values) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('emailOrPhone', profile?.email || profile?.phone);
      formData.append('subject', values.subject);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('priority', values.priority);

      // Add file if uploaded
      if (fileList.length > 0) {
        formData.append('attachment', fileList[0].originFileObj);
      }

      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/tickets/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      message.success('Ticket created successfully!');
      form.resetFields();
      setFileList([]);
      fetchTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      console.error('Error response:', err.response);
      if (err.response?.data?.details) {
        message.error(`Failed to create ticket: ${err.response.data.details}`);
      } else {
        message.error(err.response?.data?.message || 'Failed to create ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1)); // Only allow one file
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
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category.charAt(0).toUpperCase() + category.slice(1)}</Tag>
      ),
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
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
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
      ),
    },
  ];

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
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
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
                <Title level={2} style={{ margin: 0 }}>Help Center</Title>
              </Space>
            </Row>
            
            <Row gutter={[24, 24]}>
              {/* Create New Ticket */}
              <Col xs={24} lg={12}>
                <Card title="Raise a New Ticket" style={{ marginBottom: 24 }}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateTicket}
                    initialValues={{
                      category: 'technical',
                      priority: 'medium'
                    }}
                  >
                    <Form.Item
                      name="subject"
                      label="Subject"
                      rules={[{ required: true, message: 'Please enter subject' }]}
                    >
                      <Input placeholder="Brief description of your issue" />
                    </Form.Item>

                    <Form.Item
                      name="category"
                      label="Category"
                      rules={[{ required: true, message: 'Please select category' }]}
                    >
                      <Select placeholder="Select category">
                        <Option value="technical">Technical Issue</Option>
                        <Option value="academic">Academic Issue</Option>
                        <Option value="payment">Payment Issue</Option>
                        <Option value="other">Other</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="priority"
                      label="Priority"
                      rules={[{ required: true, message: 'Please select priority' }]}
                    >
                      <Select placeholder="Select priority">
                        <Option value="low">Low</Option>
                        <Option value="medium">Medium</Option>
                        <Option value="high">High</Option>
                        <Option value="urgent">Urgent</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="description"
                      label="Description"
                      rules={[{ required: true, message: 'Please describe your issue' }]}
                    >
                      <TextArea 
                        rows={4} 
                        placeholder="Please provide detailed description of your issue..."
                      />
                    </Form.Item>

                    <Form.Item label="Attachment (Optional)">
                      <Upload
                        fileList={fileList}
                        onChange={handleFileChange}
                        beforeUpload={() => false}
                        maxCount={1}
                      >
                        <Button icon={<UploadOutlined />}>Upload File</Button>
                      </Upload>
                      <Text type="secondary">Max file size: 5MB. Supported: JPG, PNG, GIF, PDF, TXT</Text>
                    </Form.Item>

                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        icon={<PlusOutlined />}
                      >
                        Create Ticket
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>

              {/* My Tickets */}
              <Col xs={24} lg={12}>
                <Card title="My Tickets" style={{ marginBottom: 24 }}>
                  {ticketsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <Empty 
                      description="No tickets found" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Table
                      columns={columns}
                      dataSource={tickets}
                      rowKey="_id"
                      pagination={false}
                      size="small"
                    />
                  )}
                </Card>
              </Col>
            </Row>

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
                </div>
              )}
            </Modal>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default HelpCenter;
