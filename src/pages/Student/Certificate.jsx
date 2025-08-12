import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Row, Col, Space, message, Modal, Empty, Tag, Divider, Spin } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';
import {
  TrophyOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined,
  EyeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import StudentSidebar from './StudentSidebar';
const { Title, Text } = Typography;

const Certificate = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Fetch certificate status
  const fetchCertificateStatus = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/student/status`, {
        emailOrPhone
      });
      setCertificateStatus(response.data);
    } catch (error) {
      console.error('Error fetching certificate status:', error);
      if (error.response?.status === 404) {
        setCertificateStatus({ hasCertificate: false });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificateStatus();
  }, []);

  // Request certificate
  const handleRequestCertificate = async () => {
    try {
      setRequesting(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/student/request`, {
        emailOrPhone
      });
      
      message.success(response.data.message);
      fetchCertificateStatus(); // Refresh status
    } catch (error) {
      console.error('Error requesting certificate:', error);
      message.error(error.response?.data?.message || 'Failed to request certificate');
    } finally {
      setRequesting(false);
    }
  };

  // Generate certificate
  const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/student/generate`, {
        emailOrPhone
      });
      
      message.success(response.data.message);
      setCertificateUrl(response.data.certificateUrl);
      fetchCertificateStatus(); // Refresh status
    } catch (error) {
      console.error('Error generating certificate:', error);
      message.error(error.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  // Download certificate
  const handleDownloadCertificate = () => {
    if (certificateStatus?.certificate?.certificateUrl) {
      window.open(`${import.meta.env.VITE_BASE_URL}${certificateStatus.certificate.certificateUrl}`, '_blank');
    }
  };

  // Print certificate
  const handlePrintCertificate = () => {
    if (certificateStatus?.certificate?.certificateUrl) {
      const printWindow = window.open(`${import.meta.env.VITE_BASE_URL}${certificateStatus.certificate.certificateUrl}`, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // Preview certificate
  const handlePreviewCertificate = () => {
    if (certificateStatus?.certificate?.previewUrl) {
      setCertificateUrl(`${import.meta.env.VITE_BASE_URL}${certificateStatus.certificate.previewUrl}`);
      setPreviewModalVisible(true);
    }
  };

  const getStatusColor = () => {
    if (!certificateStatus?.hasCertificate) return 'default';
    if (certificateStatus.certificate.isGenerated) return 'success';
    if (certificateStatus.certificate.isAllowedByAdmin) return 'processing';
    return 'warning';
  };

  const getStatusText = () => {
    if (!certificateStatus?.hasCertificate) return 'No Certificate Requested';
    if (certificateStatus.certificate.isGenerated) return 'Certificate Generated';
    if (certificateStatus.certificate.isAllowedByAdmin) return 'Approved - Ready to Generate';
    return 'Pending Admin Approval';
  };

  const getStatusIcon = () => {
    if (!certificateStatus?.hasCertificate) return <TrophyOutlined />;
    if (certificateStatus.certificate.isGenerated) return <CheckCircleOutlined />;
    if (certificateStatus.certificate.isAllowedByAdmin) return <ClockCircleOutlined />;
    return <ClockCircleOutlined />;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div style={{ padding: '24px 40px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading certificate information...</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StudentNavbar />
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ maxWidth: '1900px', margin: '24px auto', padding: '0 24px', marginLeft: sidebarCollapsed ? '80px' : '250px', transition: 'margin-left 0.2s ease', minHeight: '90vh', backgroundColor: '#f5f5f5' }}>
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
            <Title level={2} style={{ margin: 0 }}>Certificate</Title>
          </Space>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Certificate Status">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {getStatusIcon()}
                  </div>
                  <Title level={3}>{getStatusText()}</Title>
                  <Tag color={getStatusColor()} style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {getStatusText()}
                  </Tag>
                </div>

                {certificateStatus?.hasCertificate && certificateStatus.certificate && (
                  <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Certificate Number:</Text>
                        <br />
                        <Text>{certificateStatus.certificate.certificateNumber}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>Program:</Text>
                        <br />
                        <Text>{profile?.program || 'Not specified'}</Text>
                      </Col>
                    </Row>
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Issue Date:</Text>
                        <br />
                        <Text>
                          {certificateStatus.certificate.issueDate ? 
                            new Date(certificateStatus.certificate.issueDate).toLocaleDateString() : 
                            'Not set'
                          }
                        </Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>Completion Date:</Text>
                        <br />
                        <Text>
                          {certificateStatus.certificate.completionDate ? 
                            new Date(certificateStatus.certificate.completionDate).toLocaleDateString() : 
                            'Not set'
                          }
                        </Text>
                      </Col>
                    </Row>
                  </div>
                )}

                {!certificateStatus?.hasCertificate && (
                  <Empty 
                    description="No certificate requested yet"
                    image={<TrophyOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
                  />
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                {!certificateStatus?.hasCertificate && (
                  <Button
                    type="primary"
                    icon={<TrophyOutlined />}
                    block
                    onClick={handleRequestCertificate}
                    loading={requesting}
                  >
                    Request Certificate
                  </Button>
                )}

                {certificateStatus?.hasCertificate && certificateStatus.certificate.isAllowedByAdmin && !certificateStatus.certificate.isGenerated && (
                  <Button
                    type="primary"
                    icon={<FilePdfOutlined />}
                    block
                    onClick={handleGenerateCertificate}
                    loading={generating}
                  >
                    Generate Certificate
                  </Button>
                )}

                {certificateStatus?.hasCertificate && certificateStatus.certificate.isGenerated && (
                  <>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      block
                      onClick={handleDownloadCertificate}
                    >
                      Download Certificate
                    </Button>
                    <Button
                      icon={<PrinterOutlined />}
                      block
                      onClick={handlePrintCertificate}
                    >
                      Print Certificate
                    </Button>
                    <Button
                      icon={<EyeOutlined />}
                      block
                      onClick={handlePreviewCertificate}
                    >
                      Preview Certificate
                    </Button>
                  </>
                )}

                {certificateStatus?.hasCertificate && !certificateStatus.certificate.isAllowedByAdmin && (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
                    <Text type="secondary">
                      Your certificate request is pending admin approval. 
                      You will be able to generate your certificate once approved.
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Certificate Preview Modal */}
        <Modal
          title="Certificate Preview"
          open={previewModalVisible}
          onCancel={() => setPreviewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setPreviewModalVisible(false)}>
              Close
            </Button>,
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadCertificate}
            >
              Download
            </Button>,
            <Button
              key="print"
              icon={<PrinterOutlined />}
              onClick={handlePrintCertificate}
            >
              Print
            </Button>
          ]}
          width={800}
          style={{ top: 20 }}
        >
          {certificateUrl && (
            <iframe
              src={certificateUrl}
              width="100%"
              height="500px"
              style={{ border: 'none' }}
              title="Certificate Preview"
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Certificate;
