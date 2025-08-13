import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Modal, 
  Form, 
  message, 
  Descriptions, 
  Alert,
  Tooltip,
  DatePicker,
  Badge,
  Divider,
  Layout
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  EyeOutlined, 
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  ReloadOutlined,
  ExportOutlined,
  BarChartOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    program: '',
    search: '',
    dateRange: null
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundForm] = Form.useForm();
  const [refundLoading, setRefundLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch payments
  const fetchPayments = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      // Add date range if selected
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/payments/admin/all`, { params });
      
      if (response.data.success) {
        setPayments(response.data.payments);
        setPagination({
          current: response.data.currentPage,
          pageSize: pageSize,
          total: response.data.total
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      message.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Handle table pagination
  const handleTableChange = (pagination, filters, sorter) => {
    fetchPayments(pagination.current, pagination.pageSize);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchPayments(1, pagination.pageSize);
  };

  // Handle search
  const handleSearch = (value) => {
    handleFilterChange('search', value);
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    handleFilterChange('dateRange', dates);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      program: '',
      search: '',
      dateRange: null
    });
    fetchPayments(1, pagination.pageSize);
  };

  // View payment details
  const viewPaymentDetails = async (paymentId) => {
    if (!paymentId || paymentId === 'undefined') {
      message.error('Invalid payment ID');
      return;
    }
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/payments/admin/${paymentId}`);
      if (response.data.success) {
        setSelectedPayment(response.data.payment);
        setDetailModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      message.error('Failed to fetch payment details');
    }
  };

  // Process refund
  const handleRefund = async (values) => {
    if (!selectedPayment) return;

    setRefundLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/payments/admin/${selectedPayment._id}/refund`, {
        refundAmount: values.refundAmount * 100, // Convert to paise
        refundReason: values.refundReason,
        adminId: 'admin-id' // You'll need to get this from auth context
      });

      if (response.data.success) {
        message.success('Refund processed successfully');
        setRefundModalVisible(false);
        setDetailModalVisible(false);
        refundForm.resetFields();
        fetchPayments(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      message.error('Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Convert from paise
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'failed': return 'red';
      case 'refunded': return 'blue';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      case 'failed': return <CloseCircleOutlined />;
      case 'refunded': return <UndoOutlined />;
      default: return null;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.studentName || record.student?.fullName || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.studentEmail || record.student?.email || 'N/A'}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.studentName || '').localeCompare(b.studentName || '')
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color="blue">{program}</Tag>
      ),
      filters: [
        { text: '24 Session', value: '24-session' },
        { text: '48 Session', value: '48-session' }
      ]
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {formatCurrency(record.amount, record.currency)}
        </div>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)} icon={getStatusIcon(record.status)}>
          {record.status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
        { text: 'Refunded', value: 'refunded' }
      ]
    },
    {
      title: 'Payment Date',
      key: 'paymentDate',
      render: (_, record) => (
        <div>
          <div>{moment(record.paymentDate).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {moment(record.paymentDate).format('h:mm A')}
          </div>
        </div>
      ),
      sorter: (a, b) => moment(a.paymentDate).unix() - moment(b.paymentDate).unix()
    },
    {
      title: 'Payment ID',
      key: 'razorpayPaymentId',
      render: (_, record) => (
        <Tooltip title={record.razorpayPaymentId || 'N/A'}>
          <Text code style={{ fontSize: '11px' }}>
            {record.razorpayPaymentId ? 
              `${record.razorpayPaymentId.slice(0, 8)}...` : 
              'N/A'
            }
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewPaymentDetails(record._id)}
            size="small"
          >
            View
          </Button>
          {record.status === 'completed' && !record.isRefunded && (
            <Button
              type="link"
              icon={<UndoOutlined />}
              onClick={() => {
                setSelectedPayment(record);
                setRefundModalVisible(true);
              }}
              size="small"
              danger
            >
              Refund
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <AdminNavbar />
        <div style={{ padding: '24px 40px' }}>
          <Title level={2}>Payment Management</Title>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Payments"
                  value={pagination.total || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Completed"
                  value={payments.filter(p => p.status === 'completed').length || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pending"
                  value={payments.filter(p => p.status === 'pending').length || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Search by name, email, or payment ID"
                  prefix={<SearchOutlined />}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={4}>
                <Select
                  placeholder="Status"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="completed">Completed</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="failed">Failed</Option>
                  <Option value="refunded">Refunded</Option>
                </Select>
              </Col>
              <Col xs={24} sm={4}>
                <Select
                  placeholder="Program"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.program}
                  onChange={(value) => handleFilterChange('program', value)}
                >
                  <Option value="24-session">24 Session</Option>
                  <Option value="48-session">48 Session</Option>
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['Start Date', 'End Date']}
                  onChange={handleDateRangeChange}
                  value={filters.dateRange}
                />
              </Col>
              <Col xs={24} sm={2}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={clearFilters}
                  block
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Payments Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={payments}
              rowKey="_id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Card>

          {/* Payment Details Modal */}
          <Modal
            title="Payment Details"
            open={detailModalVisible}
            onCancel={() => setDetailModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setDetailModalVisible(false)}>
                Close
              </Button>,
              selectedPayment?.status === 'completed' && !selectedPayment?.isRefunded && (
                <Button
                  key="refund"
                  type="primary"
                  danger
                  icon={<UndoOutlined />}
                  onClick={() => {
                    setDetailModalVisible(false);
                    setRefundModalVisible(true);
                  }}
                >
                  Process Refund
                </Button>
              )
            ]}
            width={800}
          >
            {selectedPayment && (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Student Name" span={2}>
                  <Text strong>{selectedPayment.studentName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedPayment.studentEmail}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedPayment.studentId?.phone || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color="blue">{selectedPayment.program}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color: '#52c41a' }}>
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedPayment.status)} icon={getStatusIcon(selectedPayment.status)}>
                    {selectedPayment.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Date">
                  {moment(selectedPayment.paymentDate).format('MMMM DD, YYYY h:mm A')}
                </Descriptions.Item>
                <Descriptions.Item label="Razorpay Order ID" span={2}>
                  <Text code>{selectedPayment.razorpayOrderId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Razorpay Payment ID" span={2}>
                  <Text code>{selectedPayment.razorpayPaymentId || 'N/A'}</Text>
                </Descriptions.Item>
                {selectedPayment.completedAt && (
                  <Descriptions.Item label="Completed At">
                    {moment(selectedPayment.completedAt).format('MMMM DD, YYYY h:mm A')}
                  </Descriptions.Item>
                )}
                {selectedPayment.refundedAt && (
                  <Descriptions.Item label="Refunded At">
                    {moment(selectedPayment.refundedAt).format('MMMM DD, YYYY h:mm A')}
                  </Descriptions.Item>
                )}
                {selectedPayment.refundAmount > 0 && (
                  <>
                    <Descriptions.Item label="Refund Amount">
                      <Text strong style={{ color: '#ff4d4f' }}>
                        {formatCurrency(selectedPayment.refundAmount, selectedPayment.currency)}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Refund Reason">
                      {selectedPayment.refundReason || 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
                {selectedPayment.adminNotes && (
                  <Descriptions.Item label="Admin Notes" span={2}>
                    {selectedPayment.adminNotes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Modal>

          {/* Refund Modal */}
          <Modal
            title="Process Refund"
            open={refundModalVisible}
            onCancel={() => setRefundModalVisible(false)}
            footer={null}
          >
            <Form
              form={refundForm}
              layout="vertical"
              onFinish={handleRefund}
            >
              <Form.Item
                name="refundAmount"
                label="Refund Amount (₹)"
                rules={[
                  { required: true, message: 'Please enter refund amount' },
                  {
                    validator: (_, value) => {
                      if (value && selectedPayment) {
                        const maxAmount = selectedPayment.amount / 100;
                        if (value > maxAmount) {
                          return Promise.reject(`Refund amount cannot exceed ${formatCurrency(selectedPayment.amount)}`);
                        }
                        if (value <= 0) {
                          return Promise.reject('Refund amount must be greater than 0');
                        }
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input
                  type="number"
                  placeholder="Enter refund amount"
                  max={selectedPayment ? selectedPayment.amount / 100 : undefined}
                />
              </Form.Item>
              <Form.Item
                name="refundReason"
                label="Refund Reason"
                rules={[{ required: true, message: 'Please enter refund reason' }]}
              >
                <Input.TextArea
                  placeholder="Enter reason for refund"
                  rows={3}
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={refundLoading}
                    danger
                  >
                    Process Refund
                  </Button>
                  <Button onClick={() => setRefundModalVisible(false)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Layout>
    </Layout>
  );
};

export default PaymentManagement;
