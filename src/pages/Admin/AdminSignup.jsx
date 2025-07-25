import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Space } from 'antd';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';

const { Title } = Typography;

const AdminSignup = () => {
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignup = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/signup`, values);
      message.success('Signup successful! Please check your email for OTP.');
      setShowOTP(true);
      setEmailOrPhone(values.email);
    } catch (err) {
      message.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/verify-otp`, {
        emailOrPhone,
        otp: values.otp,
      });
      message.success('Account verified! Please login.');
      setShowOTP(false);
      form.resetFields();
      otpForm.resetFields();
      login();
      navigate('/admin-dashboard');
    } catch (err) {
      message.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Title level={3} style={{ textAlign: 'center' }}>Admin Signup</Title>
      {!showOTP ? (
        <>
          <Form form={form} layout="vertical" onFinish={handleSignup}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email required' },
                { type: 'email', message: 'Valid email required' }
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Phone required' }
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, min: 6, message: 'Min 6 chars' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>Signup</Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Typography.Text>Already have an account? <Link to="/admin-login">Login</Link></Typography.Text>
          </div>
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

export default AdminSignup;