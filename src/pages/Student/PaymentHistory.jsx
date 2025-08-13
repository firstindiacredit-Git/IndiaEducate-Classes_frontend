import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Typography, 
  Space, 
  Button, 
  message, 
  Empty, 
  Descriptions,
  Modal,
  Layout
} from 'antd';
import { 
  EyeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  UndoOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import StudentNavbar from './StudentNavbar';
import StudentSidebar from './StudentSidebar';

const { Title, Text } = Typography;

const PaymentHistory = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    if (!profile?._id) return;

    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/payments/student/${profile._id}`);
      
      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      message.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchPaymentHistory();
    }
  }, [profile]);

  // View payment details
  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailModalVisible(true);
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
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color="blue">{program}</Tag>
      )
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {formatCurrency(record.amount, record.currency)}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)} icon={getStatusIcon(record.status)}>
          {record.status.toUpperCase()}
        </Tag>
      )
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
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewPaymentDetails(record)}
          size="small"
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <StudentNavbar />
        <div style={{ padding: '24px 40px' }}>
          <Title level={2}>Payment History</Title>
          
          <Card>
            {payments.length === 0 ? (
              <Empty
                description="No payment records found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary" 
                  icon={<DollarOutlined />}
                  onClick={() => navigate('/payment')}
                >
                  Enroll in Course
                </Button>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={payments}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} payments`
                }}
              />
            )}
          </Card>

          {/* Payment Details Modal */}
          <Modal
            title="Payment Details"
            open={detailModalVisible}
            onCancel={() => setDetailModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setDetailModalVisible(false)}>
                Close
              </Button>
            ]}
            width={600}
          >
            {selectedPayment && (
              <Descriptions bordered column={1}>
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
                <Descriptions.Item label="Order ID">
                  <Text code>{selectedPayment.razorpayOrderId}</Text>
                </Descriptions.Item>
                {selectedPayment.razorpayPaymentId && (
                  <Descriptions.Item label="Payment ID">
                    <Text code>{selectedPayment.razorpayPaymentId}</Text>
                  </Descriptions.Item>
                )}
                {selectedPayment.completedAt && (
                  <Descriptions.Item label="Completed At">
                    {moment(selectedPayment.completedAt).format('MMMM DD, YYYY h:mm A')}
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
                    {selectedPayment.refundedAt && (
                      <Descriptions.Item label="Refunded At">
                        {moment(selectedPayment.refundedAt).format('MMMM DD, YYYY h:mm A')}
                      </Descriptions.Item>
                    )}
                  </>
                )}
                {selectedPayment.description && (
                  <Descriptions.Item label="Description">
                    {selectedPayment.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Modal>
        </div>
      </Layout>
    </Layout>
  );
};

export default PaymentHistory;

