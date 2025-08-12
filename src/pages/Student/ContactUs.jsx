import React, { useState } from 'react';
import {
  Typography,
  Card,
  Button,
  Form,
  Input,
  Select,
  Radio,
  message,
  Row,
  Col,
  Space,
  Divider,
  Alert,
  Descriptions,
  Tag
} from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ContactUs = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Office details
  const officeDetails = {
    address: "India Educates, Greater Kailash-1, Block R, Greater Kailash I, Greater Kailash, New Delhi, Delhi 110019",
    phone: "+91 83839 68877",
    whatsapp: "+91 83839 68877",
    email: "info@indiaeducates.org",
    website: "indiaeducates.org",
    timings: {
      weekdays: "8:00 AM - 1:00 PM",
      saturday: "8:00 AM - 12:00 PM",
      sunday: "Closed"
    }
  };

  // Handle contact form submission
  const handleContactSubmit = async (values) => {
    try {
      setLoading(true);

      const contactData = {
        studentName: profile?.fullName || values.name,
        studentEmail: profile?.email || values.email,
        studentPhone: profile?.phone || values.phone,
        service: values.service,
        message: values.message,
        degree: values.degree
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/contact/submit`,
        contactData
      );

      message.success('Your message has been sent successfully! We will get back to you soon.');
      form.resetFields();
    } catch (err) {
      console.error('Error sending contact message:', err);
      message.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ maxWidth: '1900px', margin: '24px auto', padding: '0 24px', marginLeft: sidebarCollapsed ? '80px' : '250px', transition: 'margin-left 0.2s ease', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
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
            <Title level={2} style={{ margin: 0 }}>Contact Us</Title>
          </Space>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Office Information */}
          <Col xs={24} lg={12}>
            <Card title="Office Information" style={{ marginBottom: 24 }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Address */}
                <div>
                  <Space align="start">
                    <EnvironmentOutlined style={{ fontSize: '20px', color: '#1890ff', marginTop: '4px' }} />
                    <div>
                      <Text strong>Office Address</Text>
                      <br />
                      <Text>{officeDetails.address}</Text>
                    </div>
                  </Space>
                </div>

                {/* Contact Details */}
                <div>
                  <Space align="start">
                    <PhoneOutlined style={{ fontSize: '20px', color: '#52c41a', marginTop: '4px' }} />
                    <div>
                      <Text strong>Phone Number</Text>
                      <br />
                      <Text>{officeDetails.phone}</Text>
                    </div>
                  </Space>
                </div>

                {/* Whatsapp Number */}
                <div>
                  <Space align="start">
                    <WhatsAppOutlined style={{ fontSize: '20px', color: '#25D366', marginTop: '4px' }} />
                    <div>
                      <Text strong>Whatsapp Number</Text>
                      <br />
                      <Text>{officeDetails.whatsapp}</Text>
                    </div>
                  </Space>
                </div>

                <div>
                  <Space align="start">
                    <MailOutlined style={{ fontSize: '20px', color: '#faad14', marginTop: '4px' }} />
                    <div>
                      <Text strong>Email Address</Text>
                      <br />
                      <Text>{officeDetails.email}</Text>
                    </div>
                  </Space>
                </div>

                <div>
                  <Space align="start">
                    <GlobalOutlined style={{ fontSize: '20px', color: '#722ed1', marginTop: '4px' }} />
                    <div>
                      <Text strong>Website</Text>
                      <br />
                      <Text>{officeDetails.website}</Text>
                    </div>
                  </Space>
                </div>
              </Space>
            </Card>

            {/* Office Hours */}
            <Card title="Office Hours" style={{ marginBottom: 24 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Monday - Thrusday">
                  <Tag color="blue">{officeDetails.timings.weekdays}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Friday - Saturday">
                  <Tag color="orange">{officeDetails.timings.saturday}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Sunday">
                  <Tag color="red">{officeDetails.timings.sunday}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Quick Support */}
            <Card title="Quick Support" style={{ marginBottom: 24 }}>
              <Alert
                message="Need Immediate Help?"
                description="For urgent technical issues during class hours, please call our support line or raise a ticket through the Help Center."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<MailOutlined />}
                  onClick={() => navigate('/help-center')}
                  block
                >
                  Raise Support Ticket
                </Button>

                <Button
                  icon={<PhoneOutlined />}
                  onClick={() => window.open(`tel:${officeDetails.phone}`)}
                  block
                >
                  Call Support
                </Button>

                <Button
                  icon={<MailOutlined />}
                  onClick={() => window.open(`mailto:${officeDetails.email}`)}
                  block
                >
                  Send Email
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Contact Form */}
          <Col xs={24} lg={12}>
            <Card title="Get in Touch" style={{ marginBottom: 24 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleContactSubmit}
                initialValues={{
                  email: profile?.email || '',
                  phone: profile?.phone || ''
                }}
              >
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input
                    placeholder="Enter your full name"
                    defaultValue={profile?.fullName}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input placeholder="Enter your email address" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: 'Please enter your phone number' }]}
                >
                  <Input placeholder="Enter your phone number" />
                </Form.Item>

                <Form.Item
                  name="service"
                  label="Choose Service"
                  rules={[{ required: true, message: 'Please select a service' }]}
                >
                  <Select placeholder="Choose Service">
                    <Option value="career_counseling">Career Counseling</Option>
                    <Option value="scholarship_opportunity">Scholarship Opportunity</Option>
                    <Option value="desired_university_admission">Desired University Admission</Option>
                    <Option value="para_medical_professional">Para Medical Professional</Option>
                    <Option value="degree_program">Degree Program</Option>
                    <Option value="test_preparation_guidance">Test Preparation Guidance</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="degree"
                  label="Select Degree"
                >
                  <Radio.Group>
                    <Radio value="bachelor">Bachelor Degree</Radio>
                    <Radio value="master">Master Degree</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true, message: 'Please enter your message' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Please provide detailed information about your inquiry..."
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                    block
                    size="large"
                  >
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* Map Section */}
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="Our Location" style={{ marginBottom: 24 }}>
              <div style={{
                height: '400px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #f0f0f0'
              }}>
                <iframe
                  src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=Greater+Kailash+New+Delhi+Delhi+110019"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="India Educates Office Location"
                />
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Space direction="vertical" size="small">
                  <Text strong>Office Address</Text>
                  <Text type="secondary">{officeDetails.address}</Text>
                  <Button 
                    type="link" 
                    icon={<EnvironmentOutlined />}
                    onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(officeDetails.address), '_blank')}
                  >
                    Open in Google Maps
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Additional Information */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} md={8}>
            <Card title="Response Time" style={{ textAlign: 'center' }}>
              <Space direction="vertical" align="center">
                <ClockCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                <Text strong>24-48 Hours</Text>
                <Text type="secondary">We typically respond within 24-48 hours during business days</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Support Channels" style={{ textAlign: 'center' }}>
              <Space direction="vertical" align="center">
                <PhoneOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                <Text strong>Multiple Channels</Text>
                <Text type="secondary">Phone, Email, Help Center, and Contact Form</Text>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Languages" style={{ textAlign: 'center' }}>
              <Space direction="vertical" align="center">
                <GlobalOutlined style={{ fontSize: '32px', color: '#faad14' }} />
                <Text strong>English & Hindi</Text>
                <Text type="secondary">We provide support in English and Hindi</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ContactUs;
