import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Space, Modal } from 'antd';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';
import { useRef } from 'react';

const { Title } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [forgotForm] = Form.useForm();
  const [resetForm] = Form.useForm();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/student-dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/login`, values);
      message.success('OTP sent! Please check your email.');
      setShowOTP(true);
      setEmailOrPhone(values.emailOrPhone);
    } catch (err) {
      message.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/verify-otp`, {
        emailOrPhone,
        otp: values.otp,
      });
      // Try to login as student
      const loginSuccess = login('student');
      if (!loginSuccess) {
        setLoading(false);
        return;
      }
      message.success('Login successful!');
      setShowOTP(false);
      form.resetFields();
      otpForm.resetFields();
      navigate('/student-dashboard');
    } catch (err) {
      message.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Title level={3} style={{ textAlign: 'center' }}>Student Login</Title>
      {!showOTP ? (
        <>
          <Form form={form} layout="vertical" onFinish={handleLogin}>
            <Form.Item
              name="emailOrPhone"
              label="Email"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, min: 6, message: 'Min 6 chars' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Login</Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text>Don't have an account? <Link to="/signup">Signup</Link></Typography.Text>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Button type="link" onClick={() => setForgotModalOpen(true)}>
              Forgot Password?
            </Button>
          </div>
          <Modal
            open={forgotModalOpen}
            onCancel={() => {
              setForgotModalOpen(false);
              setForgotStep(1);
              setForgotEmail('');
              setForgotOtp('');
              forgotForm.resetFields();
            }}
            footer={null}
            title="Forgot Password"
            destroyOnClose
          >
            {forgotStep === 1 && (
              <Form
                layout="vertical"
                form={forgotForm}
                onFinish={async (values) => {
                  setForgotLoading(true);
                  try {
                    await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/forgot-password`, { email: values.email });
                    setForgotEmail(values.email);
                    setForgotStep(2);
                    message.success('OTP sent! Please check your email.');
                  } catch (err) {
                    message.error(err.response?.data?.message || 'Failed to send OTP');
                  } finally {
                    setForgotLoading(false);
                  }
                }}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Email is required' },
                    {
                      type: 'email',
                      message: 'Valid email required',
                      transform: (value) => value && value.trim(),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block loading={forgotLoading}>Send OTP</Button>
                </Form.Item>
              </Form>
            )}
            {forgotStep === 2 && (
              <Form
                layout="vertical"
                form={forgotForm}
                onFinish={async (values) => {
                  setForgotLoading(true);
                  try {
                    setForgotOtp(values.otp);
                    setForgotStep(3);
                    setForgotModalOpen(false);
                    setResetModalOpen(true);
                  } catch {
                    message.error('OTP verification failed');
                  } finally {
                    setForgotLoading(false);
                  }
                }}
              >
                <Form.Item label="Email">
                  <Input value={forgotEmail} disabled />
                </Form.Item>
                <Form.Item
                  name="otp"
                  label="Enter OTP"
                  rules={[
                    { required: true, message: 'OTP is required' },
                    {
                      validator: (_, value) =>
                        value && /^\d{6}$/.test(value)
                          ? Promise.resolve()
                          : Promise.reject(new Error('6-digit OTP required')),
                    },
                  ]}
                >
                  <Input maxLength={6} type="text" inputMode="numeric" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block loading={forgotLoading}>Verify OTP</Button>
                </Form.Item>
              </Form>
            )}
          </Modal>
          <Modal
            open={resetModalOpen}
            onCancel={() => {
              setResetModalOpen(false);
              setForgotStep(1);
              setForgotEmail('');
              setForgotOtp('');
              resetForm.resetFields();
            }}
            footer={null}
            title="Reset Password"
            destroyOnClose
          >
            <Form
              layout="vertical"
              form={resetForm}
              onFinish={async (values) => {
                setForgotLoading(true);
                try {
                  await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/reset-password`, {
                    email: forgotEmail,
                    otp: forgotOtp,
                    newPassword: values.newPassword,
                  });
                  message.success('Password updated! Please login with your new password.');
                  setResetModalOpen(false);
                  setForgotStep(1);
                  setForgotEmail('');
                  setForgotOtp('');
                  resetForm.resetFields();
                  navigate('/', { replace: true });
                } catch (err) {
                  message.error(err.response?.data?.message || 'Failed to reset password');
                } finally {
                  setForgotLoading(false);
                }
              }}
            >
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[{ required: true, min: 6, message: 'Min 6 chars' }]}
                hasFeedback
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["newPassword"]}
                hasFeedback
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={forgotLoading}>Reset Password</Button>
              </Form.Item>
            </Form>
          </Modal>
        </>
      ) : (
        <Form form={otpForm} layout="vertical" onFinish={handleVerifyOTP}>
          <Form.Item
            name="otp"
            label="Enter OTP"
            rules={[
              { required: true, message: 'OTP is required' },
              {
                validator: (_, value) =>
                  value && /^\d{6}$/.test(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('6-digit OTP required')),
              },
            ]}
          >
            <Input maxLength={6} type="text" inputMode="numeric" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>Verify OTP</Button>
              <Button onClick={() => setShowOTP(false)}>Back</Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </div>
  );
};

export default Login;