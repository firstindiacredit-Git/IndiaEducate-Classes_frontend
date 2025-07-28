import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Upload, message, Typography, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../component/AuthProvider';
import { useCountries } from '../../component/CountriesApi';

const { Title } = Typography;
const { Option } = Select;

const CreateProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [fileList, setFileList] = useState([]);
  const { countries, loading: countriesLoading, renderCountryLabel } = useCountries();
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLessThan5MB = file.size <= MAX_FILE_SIZE;
    if (!isLessThan5MB) {
      message.error('Image must be smaller than 5MB! Please choose a smaller file.');
      return false;
    }

    return true;
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      if (!emailOrPhone) {
        throw new Error('Email or phone not found');
      }

      const formData = new FormData();
      
      // Add file if exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('profilePicture', fileList[0].originFileObj);
      }
      
      // Add other form data
      formData.append('emailOrPhone', emailOrPhone);
      formData.append('fullName', values.fullName);
      formData.append('country', values.country);
      // Only append enrollmentId if it has a value
      if (values.enrollmentId && values.enrollmentId.trim() !== '') {
        formData.append('enrollmentId', values.enrollmentId);
      }
      formData.append('program', values.program);

      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/student/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (res.data && res.data.profile) {
        setProfile(res.data.profile);
        message.success('Profile created successfully!');
        navigate('/student-dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setFileList([]); // Clear file list on error
      if (err.code === 'ECONNABORTED') {
        message.error('Upload timeout. Please try again with a smaller file.');
      } else {
        message.error(err.response?.data?.message || 'Failed to create profile. Please try again.');
      }
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
          extra="Max file size: 5MB. Supported formats: JPG, PNG, GIF"
        >
          <Upload
            beforeUpload={beforeUpload}
            fileList={fileList}
            onChange={({ fileList, file }) => {
              // Only update fileList if file passes validation
              if (file.status !== 'error') {
                setFileList(fileList.map(f => ({
                  ...f,
                  status: 'done' // Force status to done since we're handling upload manually
                })));
              }
            }}
            customRequest={({ file, onSuccess }) => {
              // We'll handle the actual upload in onFinish
              onSuccess();
            }}
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
            loading={countriesLoading}
            filterOption={(input, option) => {
              const countryName = option?.label?.props?.children[1];
              return countryName?.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {countries.map((country) => (
              <Option 
                key={country.name.common} 
                value={country.name.common}
                label={renderCountryLabel(country)}
              >
                {renderCountryLabel(country)}
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