import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Typography, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';

const { Title } = Typography;
const { Option } = Select;

const CreateProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [fileList, setFileList] = useState([]);
  const [countries, setCountries] = useState([]);
  const { profile, setProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch profile for prefill
    const fetchProfile = async () => {
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      if (!emailOrPhone) return;
      try {
        const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/profile`, { emailOrPhone });
        setInitialValues(res.data);
        form.setFieldsValue({
          email: res.data.email,
          phone: res.data.phone,
        });
      } catch (err) {
        message.error('Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [form]);

  useEffect(() => {
    // Fetch countries data
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags');
        const sortedCountries = response.data.sort((a, b) => 
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sortedCountries);
      } catch (error) {
        message.error('Failed to fetch countries');
      }
    };
    fetchCountries();
  }, []);

  const handleUpload = async (file) => {
    // For demo, convert to base64. In production, upload to server or S3.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      let profilePicture = initialValues.profilePicture || '';
      if (fileList.length > 0) {
        profilePicture = await handleUpload(fileList[0].originFileObj);
      }
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const payload = {
        emailOrPhone,
        fullName: values.fullName,
        country: values.country,
        enrollmentId: values.enrollmentId,
        program: values.program,
        profilePicture,
      };
      await axios.put(`${import.meta.env.VITE_BASE_URL}/api/student/profile`, payload);
      setProfile({ ...initialValues, ...payload });
      message.success('Profile updated!');
      navigate('/student-dashboard');
    } catch (err) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <Title level={3} style={{ textAlign: 'center' }}>Create Your Profile</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Form.Item 
          label="Profile Picture" 
          name="profilePicture"
          rules={[
            { required: false, message: 'Profile picture is optional' }
          ]}
        >
          <Upload
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            maxCount={1}
            accept="image/*"
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>
        
        <Form.Item 
          label="Full Name" 
          name="fullName" 
          rules={[
            { required: true, message: 'Full name is required' },
            { min: 2, message: 'Full name must be at least 2 characters' },
            { max: 50, message: 'Full name cannot exceed 50 characters' }
          ]}
        > 
          <Input placeholder="Enter your full name" /> 
        </Form.Item>
        
        <Form.Item 
          label="Email" 
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input disabled placeholder="Your email address" />
        </Form.Item>
        
        <Form.Item 
          label="Phone Number" 
          name="phone"
          rules={[
            { required: true, message: 'Phone number is required' },
            { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' },
            { min: 10, message: 'Phone number must be at least 10 digits' }
          ]}
        >
          <Input disabled placeholder="Your phone number" />
        </Form.Item>
        
        <Form.Item 
          label="Country/Region" 
          name="country" 
          rules={[
            { required: true, message: 'Country/Region is required' }
          ]}
        > 
          <Select
            showSearch
            placeholder="Search and select your country"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.props.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {countries.map((country) => (
              <Option key={country.name.common} value={country.name.common}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={country.flags.png} 
                    alt={country.flags.alt || country.name.common}
                    style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
                  />
                  {country.name.common}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item 
          label="Enrollment Id" 
          name="enrollmentId" 
          rules={[
            { min: 3, message: 'Enrollment ID must be at least 3 characters' },
            { max: 20, message: 'Enrollment ID cannot exceed 20 characters' }
          ]}
        > 
          <Input placeholder="Enter your enrollment ID" /> 
          <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
            If you have an Enrollment ID, please enter it. Otherwise, you can leave this field blank.
          </div>
        </Form.Item>
        
        <Form.Item 
          label="Program Enrolled" 
          name="program" 
          rules={[
            { required: true, message: 'Please select a program' }
          ]}
        > 
          <Select placeholder="Select your program">
            <Option value="24-session">24-session</Option>
            <Option value="48-session">48-session</Option>
          </Select> 
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>Save Profile</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CreateProfile; 