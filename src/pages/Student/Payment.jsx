import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Alert, Steps, message, Modal, Descriptions, Tag, Spin, Divider, Layout } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  BookOutlined,
  SafetyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import StudentSidebar from './StudentSidebar';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const Payment = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Program details
  const allPrograms = [
    {
      id: '24-session',
      name: '24 Session Program',
      price: 1,
      currency: 'INR',
      description: 'Complete 24 interactive sessions with expert instructors',
      features: [
        '24 Live Interactive Sessions',
        'Personalized Learning Path',
        'Progress Tracking',
        'Certificate of Completion',
        '24/7 Support',
        'Study Materials Access'
      ],
      duration: '3 months',
      sessions: '24 sessions'
    },
    {
      id: '48-session',
      name: '48 Session Program',
      price: 1,
      currency: 'INR',
      description: 'Comprehensive 48 sessions for in-depth learning experience',
      features: [
        '48 Live Interactive Sessions',
        'Advanced Learning Modules',
        'Personalized Mentoring',
        'Premium Certificate',
        'Priority Support',
        'Extended Study Materials',
        'Mock Tests & Assessments',
        'Career Guidance'
      ],
      duration: '6 months',
      sessions: '48 sessions'
    }
  ];

  // Filter programs based on student's selected program during profile creation
  const programs = profile?.program ? 
    allPrograms.filter(program => program.id === profile.program) : 
    [];

  // Check if user is authenticated and has selected a program
  useEffect(() => {
    if (!profile) {
      message.error('Please login to access payment page');
      navigate('/login');
      return;
    }

    // Check if student has selected a program during profile creation
    if (!profile.program) {
      message.warning('Please complete your profile and select a program first');
      navigate('/create-profile');
      return;
    }

    // If student has already selected a program during profile creation, auto-select it
    if (profile.program && programs.length > 0) {
      const studentProgram = programs.find(program => program.id === profile.program);
      if (studentProgram) {
        setSelectedProgram(studentProgram);
        // Don't skip the program selection step - show it with the selected program
        setCurrentStep(0);
      }
    }
  }, [profile, navigate, programs]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setCurrentStep(1);
  };

  const handlePayment = async () => {
    if (!selectedProgram || !profile) {
      message.error('Please select a program first');
      return;
    }

    setPaymentLoading(true);
    try {
      // Create payment order
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/payments/create-order`, {
        studentId: profile._id,
        program: selectedProgram.id,
        studentEmail: profile.email,
        studentName: profile.fullName || 'Student'
      });

      if (response.data.success) {
        setPaymentData(response.data);
        const createdPaymentId = response.data.paymentId;

        // Initialize Razorpay
        const options = {
          key: response.data.key,
          amount: response.data.amount,
          currency: response.data.currency,
          name: 'India Educates',
          description: `${selectedProgram.name} - Course Enrollment`,
          order_id: response.data.orderId,
          handler: function (response) {
            handlePaymentSuccess(response, createdPaymentId);
          },
          prefill: {
            name: profile.fullName || 'Student',
            email: profile.email,
            contact: profile.phone || ''
          },
          notes: {
            program: selectedProgram.id,
            studentId: profile._id
          },
          theme: {
            color: '#1890ff'
          },
          modal: {
            ondismiss: function() {
              setPaymentLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        message.error('Failed to create payment order');
      }
    } catch (error) {
      console.error('Payment error:', error);
      message.error('Payment initialization failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (response, createdPaymentId) => {
    setPaymentLoading(true);
    try {
      const verifyPaymentId = createdPaymentId || paymentData?.paymentId;
      if (!verifyPaymentId) {
        throw new Error('Missing paymentId for verification');
      }
      // Verify payment
      const verifyResponse = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/payments/verify-payment`, {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        paymentId: verifyPaymentId
      });

      if (verifyResponse.data.success) {
        setPaymentStatus('success');
        setCurrentStep(2);
        message.success('Payment successful! Welcome to your course.');
        
        // Update user profile with program
        // This will be handled by the backend when payment is verified
      } else {
        setPaymentStatus('failed');
        message.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      message.error('Payment verification failed. Please contact support.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student-dashboard');
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const steps = [
    {
      title: 'Program Selection',
      icon: <BookOutlined />
    },
    {
      title: 'Payment',
      icon: <CreditCardOutlined />
    },
    {
      title: 'Confirmation',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <StudentNavbar />
        <div style={{ padding: '24px 40px' }}>
          <Title level={2}>Course Enrollment & Payment</Title>
          
          {/* Progress Steps */}
          <div style={{ marginBottom: 32 }}>
            <Steps current={currentStep} size="small">
              {steps.map((step, index) => (
                <Step key={index} title={step.title} icon={step.icon} />
              ))}
            </Steps>
          </div>

          {/* Step 1: Program Selection */}
          {currentStep === 0 && (
            <div>
              {programs.length > 0 ? (
                <>
                  <Title level={3}>Program Selection</Title>
                  <Paragraph>
                    Here is the program you selected during profile creation:
                  </Paragraph>
                  
                  <Row gutter={[24, 24]}>
                    {programs.map((program) => (
                      <Col xs={24} md={12} key={program.id}>
                        <Card
                          style={{
                            border: '2px solid #1890ff',
                            backgroundColor: '#f0f8ff'
                          }}
                        >
                          <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Title level={4} style={{ color: '#1890ff' }}>
                              {program.name}
                            </Title>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                              {formatCurrency(program.price, program.currency)}
                            </div>
                            <Text type="secondary">{program.duration} • {program.sessions}</Text>
                          </div>
                          
                          <Paragraph style={{ textAlign: 'center', marginBottom: 16 }}>
                            {program.description}
                          </Paragraph>
                          
                          <Divider />
                          
                          <div>
                            <Title level={5}>What's Included:</Title>
                            <ul style={{ paddingLeft: 20 }}>
                              {program.features.map((feature, index) => (
                                <li key={index} style={{ marginBottom: 8 }}>
                                  <Text>{feature}</Text>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Button 
                              type="primary"
                              size="large"
                              icon={<BookOutlined />}
                              onClick={() => handleProgramSelect(program)}
                            >
                              Proceed to Payment
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Alert
                    message="No Program Selected"
                    description="Please complete your profile and select a program before proceeding with payment."
                    type="warning"
                    showIcon
                    style={{ maxWidth: 500, margin: '0 auto' }}
                  />
                  <div style={{ marginTop: 24 }}>
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/create-profile')}
                    >
                      Complete Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 1 && selectedProgram && (
            <div>
              <Title level={3}>Complete Your Payment</Title>
              
              <Row gutter={[24, 24]}>
                <Col xs={24} md={16}>
                  <Card title="Payment Details">
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="Program">
                        <Text strong>{selectedProgram.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Student Name">
                        <Text>{profile?.fullName || 'Student'}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        <Text>{profile?.email}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amount">
                        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                          {formatCurrency(selectedProgram.price, selectedProgram.currency)}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Method">
                        <Tag color="blue" icon={<CreditCardOutlined />}>
                          Razorpay (Secure Payment Gateway)
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <div style={{ marginTop: 24 }}>
                      <Alert
                        message="Secure Payment"
                        description="Your payment is processed securely through Razorpay. We support all major credit cards, debit cards, UPI, and net banking."
                        type="info"
                        showIcon
                        icon={<SafetyOutlined />}
                      />
                    </div>
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card title="Order Summary">
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Program Fee:</Text>
                        <Text>{formatCurrency(selectedProgram.price, selectedProgram.currency)}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Taxes:</Text>
                        <Text>Included</Text>
                      </div>
                      <Divider />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Text strong>Total:</Text>
                        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                          {formatCurrency(selectedProgram.price, selectedProgram.currency)}
                        </Text>
                      </div>
                    </div>
                    
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<CreditCardOutlined />}
                      onClick={handlePayment}
                      loading={paymentLoading}
                    >
                      {paymentLoading ? 'Processing...' : 'Pay Now'}
                    </Button>
                    
                    <div style={{ marginTop: 16 }}>
                      <Button 
                        type="default" 
                        block 
                        onClick={() => setCurrentStep(0)}
                      >
                        Back to Program Selection
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 2 && (
            <div style={{ textAlign: 'center' }}>
              {paymentStatus === 'success' ? (
                <Card>
                  <div style={{ marginBottom: 24 }}>
                    <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
                  </div>
                  <Title level={3} style={{ color: '#52c41a' }}>
                    Payment Successful!
                  </Title>
                  <Paragraph style={{ fontSize: '16px' }}>
                    Welcome to {selectedProgram?.name}! Your enrollment has been confirmed.
                  </Paragraph>
                  
                  <Descriptions bordered column={1} style={{ marginTop: 24, marginBottom: 24 }}>
                    <Descriptions.Item label="Program">
                      <Text strong>{selectedProgram?.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount Paid">
                      <Text strong style={{ color: '#52c41a' }}>
                        {formatCurrency(selectedProgram?.price, selectedProgram?.currency)}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment ID">
                      <Text code>{paymentData?.orderId}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color="green">Completed</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                  
                  <div style={{ marginTop: 24 }}>
                    <Alert
                      message="Next Steps"
                      description="You will receive an email confirmation shortly. Your course access will be activated within 24 hours."
                      type="success"
                      showIcon
                    />
                  </div>
                  
                  <div style={{ marginTop: 24 }}>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={handleBackToDashboard}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div style={{ marginBottom: 24 }}>
                    <ClockCircleOutlined style={{ fontSize: '64px', color: '#faad14' }} />
                  </div>
                  <Title level={3} style={{ color: '#faad14' }}>
                    Payment Processing
                  </Title>
                  <Paragraph>
                    Your payment is being processed. Please wait...
                  </Paragraph>
                  <Spin size="large" />
                </Card>
              )}
            </div>
          )}
        </div>
      </Layout>
    </Layout>
  );
};

export default Payment;
