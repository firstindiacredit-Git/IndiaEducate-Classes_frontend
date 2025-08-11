import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Tag, 
  Button, 
  Modal, 
  message, 
  Space, 
  Descriptions,
  Row,
  Col,
  Statistic,
  Pagination,
  Alert,
  Layout
} from 'antd';
import { 
  ArrowLeftOutlined,
  EyeOutlined, 
  MailOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Content } = Layout;

const ContactManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pageSize: 20
  });

  // Fetch contacts
  const fetchContacts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: pagination.pageSize,
        ...filters
      });

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/contact/admin/contacts?${params}`);
      setContacts(response.data.contacts);
      setPagination(prev => ({
        ...prev,
        current: response.data.pagination.current,
        total: response.data.pagination.totalContacts
      }));
    } catch (err) {
      console.error('Error fetching contacts:', err);
      message.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/contact/admin/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [filters]);





  // Table columns
  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <Space>
          <div>
            <div>{record.studentName}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.studentEmail}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      ellipsis: true,
      width: 200,
      render: (service) => (
        <Text>{service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
      ),
    },
    {
      title: 'Degree',
      dataIndex: 'degree',
      key: 'degree',
      render: (degree) => (
        <Text>{degree === 'bachelor' ? 'Bachelor Degree' : 'Master Degree'}</Text>
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
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={async () => {
            setSelectedContact(record);
            setModalVisible(true);
            
            // Fetch complete contact details including student info
            try {
              const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/contact/admin/contact/${record._id}`);
              setSelectedContact(response.data.contact);
              setSelectedStudent(response.data.student);
            } catch (err) {
              console.error('Error fetching contact details:', err);
              message.error('Failed to fetch complete contact details');
            }
          }}
        >
          View
        </Button>
      ),
      width: 100,
    },
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
              <Title level={2} style={{ margin: 0 }}>Contact Management</Title>
            </Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchContacts();
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
                title="Total Contacts"
                value={stats.totalContacts || 0}
                prefix={<MailOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>



        {/* Contacts Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={contacts}
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
              onChange={fetchContacts}
              showSizeChanger={false}
              showQuickJumper
            />
          </div>
        </Card>

        {/* Contact Details Modal */}
        <Modal
          title={
            <div style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
              <Title level={4} style={{ margin: 0 }}>Contact Form Details</Title>
            </div>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedContact(null);
            setSelectedStudent(null);
          }}
          footer={null}
          width={800}
          centered
        >
          {selectedContact && (
            <div style={{ padding: '20px 0' }}>
              {/* Contact Form Information */}
              <div style={{ marginBottom: 24 }}>
                <Title level={5} style={{ marginBottom: 16, color: '#1890ff' }}>
                  📝 Contact Form Submission
                </Title>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Student Name" span={2}>
                    <Text strong>{selectedContact.studentName}</Text>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Email">
                    <Text>{selectedContact.studentEmail}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Text>{selectedContact.studentPhone}</Text>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Service Requested" span={2}>
                    <Tag color="blue" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      {selectedContact.service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Tag>
                  </Descriptions.Item>
                  
                  {selectedContact.degree && (
                    <Descriptions.Item label="Selected Degree">
                      <Tag color="green" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        {selectedContact.degree === 'bachelor' ? 'Bachelor Degree' : 'Master Degree'}
                      </Tag>
                    </Descriptions.Item>
                  )}
                  
                  <Descriptions.Item label="Submission Date">
                    <Text type="secondary">
                      {moment(selectedContact.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                    </Text>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Message" span={2}>
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}>
                      <Text>{selectedContact.message}</Text>
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Student Profile Information */}
              <div>
                <Title level={5} style={{ marginBottom: 16, color: '#52c41a' }}>
                  👤 Student Profile Information
                </Title>
                                 <Alert
                   message="Student Profile Details"
                   description={selectedStudent ? 
                     "Below are the complete student profile details from our database" : 
                     "Student profile not found in our database. This might be a new contact form submission."
                   }
                   type={selectedStudent ? "info" : "warning"}
                   showIcon
                   style={{ marginBottom: 16 }}
                 />
                
                                 <Descriptions bordered column={2} size="small">
                   <Descriptions.Item label="Full Name" span={2}>
                     <Text strong>{selectedStudent?.fullName || selectedContact.studentName}</Text>
                   </Descriptions.Item>
                   
                   <Descriptions.Item label="Email Address">
                     <Text>{selectedStudent?.email || selectedContact.studentEmail}</Text>
                   </Descriptions.Item>
                   <Descriptions.Item label="Phone Number">
                     <Text>{selectedStudent?.phone || selectedContact.studentPhone}</Text>
                   </Descriptions.Item>
                   
                   <Descriptions.Item label="Profile Picture">
                     {selectedStudent?.profilePicture ? (
                       <div style={{ display: 'flex', alignItems: 'center' }}>
                         <img 
                           src={selectedStudent.profilePicture} 
                           alt="Profile" 
                           style={{ 
                             width: '40px', 
                             height: '40px', 
                             borderRadius: '50%', 
                             objectFit: 'cover',
                             marginRight: '8px'
                           }} 
                         />
                         <Text>Profile Picture Available</Text>
                       </div>
                     ) : (
                       <Text type="secondary">No profile picture</Text>
                     )}
                   </Descriptions.Item>
                   <Descriptions.Item label="Country/Region">
                     {selectedStudent?.country ? (
                       <Text>{selectedStudent.country}</Text>
                     ) : (
                       <Text type="secondary">Not specified</Text>
                     )}
                   </Descriptions.Item>
                   
                   <Descriptions.Item label="Enrollment ID">
                     {selectedStudent?.enrollmentId ? (
                       <Text>{selectedStudent.enrollmentId}</Text>
                     ) : (
                       <Text type="secondary">Not specified</Text>
                     )}
                   </Descriptions.Item>
                   <Descriptions.Item label="Program">
                     {selectedStudent?.program ? (
                       <Tag color="blue">{selectedStudent.program}</Tag>
                     ) : (
                       <Text type="secondary">Not specified</Text>
                     )}
                   </Descriptions.Item>
                   
                   <Descriptions.Item label="Account Status">
                     {selectedStudent ? (
                       <Tag color={selectedStudent.isVerified ? 'success' : 'error'}>
                         {selectedStudent.isVerified ? 'Verified' : 'Not Verified'}
                       </Tag>
                     ) : (
                       <Text type="secondary">Unknown</Text>
                     )}
                   </Descriptions.Item>
                   <Descriptions.Item label="Verification Status">
                     {selectedStudent ? (
                       <Tag color={selectedStudent.isVerified ? 'success' : 'error'}>
                         {selectedStudent.isVerified ? 'Verified' : 'Not Verified'}
                       </Tag>
                     ) : (
                       <Text type="secondary">Unknown</Text>
                     )}
                   </Descriptions.Item>
                   
                   <Descriptions.Item label="Registration Date">
                     {selectedStudent?.createdAt ? (
                       <Text>{moment(selectedStudent.createdAt).format('MMMM DD, YYYY')}</Text>
                     ) : (
                       <Text type="secondary">Unknown</Text>
                     )}
                   </Descriptions.Item>
                   <Descriptions.Item label="Last Login">
                     {selectedStudent?.lastLogin ? (
                       <Text>{moment(selectedStudent.lastLogin).format('MMMM DD, YYYY [at] h:mm A')}</Text>
                     ) : (
                       <Text type="secondary">Unknown</Text>
                     )}
                   </Descriptions.Item>
                 </Descriptions>
              </div>

                             {/* Additional Notes */}
               {!selectedStudent && (
                 <div style={{ marginTop: 16 }}>
                   <Alert
                     message="Note"
                     description="This contact form was submitted by someone who is not registered in our student database. For complete student management features, please visit the Student Management section."
                     type="warning"
                     showIcon
                   />
                 </div>
               )}
            </div>
          )}
        </Modal>


        </Content>
      </Layout>
    </Layout>
  );
};

export default ContactManagement;
