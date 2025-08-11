import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Table, Button, Modal, message, Tag, Space, Avatar, Image, Tooltip, Layout } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  FilePdfOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

const CertificateManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);

  // Fetch all certificate requests
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('adminEmailOrPhone');
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/admin/requests`, {
        emailOrPhone
      });
      setCertificates(response.data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      message.error('Failed to fetch certificate requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Allow certificate generation
  const handleAllowCertificate = async (certificateId) => {
    try {
      setApproving(true);
      const emailOrPhone = localStorage.getItem('adminEmailOrPhone');
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/admin/allow/${certificateId}`, {
        emailOrPhone
      });
      
      message.success('Certificate generation allowed');
      fetchCertificates(); // Refresh list
    } catch (error) {
      console.error('Error allowing certificate:', error);
      message.error('Failed to allow certificate generation');
    } finally {
      setApproving(false);
    }
  };

  // Deny certificate generation
  const handleDenyCertificate = async (certificateId) => {
    try {
      setDenying(true);
      const emailOrPhone = localStorage.getItem('adminEmailOrPhone');
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/admin/deny/${certificateId}`, {
        emailOrPhone
      });
      
      message.success('Certificate generation denied');
      fetchCertificates(); // Refresh list
    } catch (error) {
      console.error('Error denying certificate:', error);
      message.error('Failed to deny certificate generation');
    } finally {
      setDenying(false);
    }
  };

  // Show view modal
  const showViewModal = (certificate) => {
    setSelectedCertificate(certificate);
    setViewModalVisible(true);
  };

  const getStatusColor = (certificate) => {
    if (certificate.isGenerated) return 'success';
    if (certificate.isAllowedByAdmin) return 'processing';
    return 'warning';
  };

  const getStatusText = (certificate) => {
    if (certificate.isGenerated) return 'Generated';
    if (certificate.isAllowedByAdmin) return 'Approved';
    return 'Pending';
  };

  const getStatusIcon = (certificate) => {
    if (certificate.isGenerated) return <CheckCircleOutlined />;
    if (certificate.isAllowedByAdmin) return <ClockCircleOutlined />;
    return <ClockCircleOutlined />;
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 70,
    },
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.studentId?.profilePicture} 
            icon={<UserOutlined />} 
            size={40}
            style={{ marginRight: '12px' }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.studentId?.fullName || 'Unknown Student'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.studentId?.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Certificate Number',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color="blue">{program}</Tag>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record)} icon={getStatusIcon(record)}>
          {getStatusText(record)}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record)}
          >
            View
          </Button>
          {!record.isAllowedByAdmin && !record.isGenerated && (
            <>
              <Button
                type="link"
                style={{ color: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleAllowCertificate(record._id)}
                loading={approving}
              >
                Allow
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleDenyCertificate(record._id)}
                loading={denying}
              >
                Deny
              </Button>
            </>
          )}
          {record.isAllowedByAdmin && !record.isGenerated && (
            <Tag color="processing">Ready to Generate</Tag>
          )}
          {record.isGenerated && (
            <Tag color="success">Generated</Tag>
          )}
        </Space>
      ),
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
              <Title level={2} style={{ margin: 0 }}>Certificate Management</Title>
            </Space>
          </Row>

          <Card>
            <Table
              columns={columns}
              dataSource={certificates}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} certificates`
              }}
            />
          </Card>

          {/* View Certificate Modal */}
          <Modal
            title={
              <div style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                <Title level={4} style={{ margin: 0 }}>Certificate Details</Title>
              </div>
            }
            open={viewModalVisible}
            onCancel={() => {
              setViewModalVisible(false);
              setSelectedCertificate(null);
            }}
            footer={[
              <Button key="close" onClick={() => {
                setViewModalVisible(false);
                setSelectedCertificate(null);
              }}>
                Close
              </Button>
            ]}
            width={600}
            centered
          >
            {selectedCertificate && (
              <div style={{ padding: '20px 0' }}>
                <Row gutter={16}>
                  <Col span={24}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                        {selectedCertificate.studentId?.fullName || 'Unknown Student'}
                      </div>
                      <div style={{ color: '#666', fontSize: 14 }}>
                        <Tag color="blue">{selectedCertificate.program}</Tag>
                      </div>
                    </div>

                    <div style={{
                      background: '#fafafa',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Certificate Number</div>
                            <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                              <Text code>{selectedCertificate.certificateNumber}</Text>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Status</div>
                            <div style={{ fontSize: 14 }}>
                              <Tag color={getStatusColor(selectedCertificate)} icon={getStatusIcon(selectedCertificate)}>
                                {getStatusText(selectedCertificate)}
                              </Tag>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Request Date</div>
                            <div style={{ fontSize: 14 }}>
                              {new Date(selectedCertificate.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Issue Date</div>
                            <div style={{ fontSize: 14 }}>
                              {selectedCertificate.issueDate ? 
                                new Date(selectedCertificate.issueDate).toLocaleDateString() : 
                                'Not set'
                              }
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Completion Date</div>
                            <div style={{ fontSize: 14 }}>
                              {selectedCertificate.completionDate ? 
                                new Date(selectedCertificate.completionDate).toLocaleDateString() : 
                                'Not set'
                              }
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Student Email</div>
                            <div style={{ fontSize: 14 }}>
                              {selectedCertificate.studentId?.email || 'Not available'}
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {selectedCertificate.adminApprovalDate && (
                        <Row gutter={16}>
                          <Col span={12}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Admin Approval Date</div>
                              <div style={{ fontSize: 14 }}>
                                {new Date(selectedCertificate.adminApprovalDate).toLocaleDateString()}
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Approved By</div>
                              <div style={{ fontSize: 14 }}>
                                {selectedCertificate.adminApprovedBy ? 'Admin' : 'Not specified'}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </div>

                    {!selectedCertificate.isAllowedByAdmin && !selectedCertificate.isGenerated && (
                      <div style={{ marginTop: 16 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                              handleAllowCertificate(selectedCertificate._id);
                              setViewModalVisible(false);
                            }}
                            loading={approving}
                          >
                            Allow Certificate Generation
                          </Button>
                          <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => {
                              handleDenyCertificate(selectedCertificate._id);
                              setViewModalVisible(false);
                            }}
                            loading={denying}
                          >
                            Deny Certificate Generation
                          </Button>
                        </Space>
                      </div>
                    )}

                    {selectedCertificate.isAllowedByAdmin && !selectedCertificate.isGenerated && (
                      <div style={{ marginTop: 16 }}>
                        <Tag color="processing" icon={<ClockCircleOutlined />}>
                          Student can now generate their certificate
                        </Tag>
                      </div>
                    )}

                    {selectedCertificate.isGenerated && (
                      <div style={{ marginTop: 16 }}>
                        <Tag color="success" icon={<FilePdfOutlined />}>
                          Certificate has been generated by student
                        </Tag>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CertificateManagement;
