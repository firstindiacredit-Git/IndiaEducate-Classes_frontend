import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Avatar, Dropdown, Menu, Row, Col, Modal, Form, Input, Select, Upload, message, Descriptions, Tag, Image } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, UploadOutlined, EyeOutlined, EditOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const StudentDashboard = () => {
  const { logout, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [countries, setCountries] = useState([]);

  // Fetch countries data
  useEffect(() => {
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

  // Fetch profile if not loaded
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile) {
        const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
        if (!emailOrPhone) return;
        try {
          const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/profile`, { emailOrPhone });
          setProfile(res.data);
        } catch (err) {
          // handle error
        }
      }
    };
    fetchProfile();
  }, [profile, setProfile]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const showEditModal = () => {
    form.setFieldsValue({
      fullName: profile?.fullName,
      email: profile?.email,
      phone: profile?.phone,
      country: profile?.country,
      enrollmentId: profile?.enrollmentId,
      program: profile?.program,
    });
    setEditModalVisible(true);
  };

  const showViewModal = () => {
    setViewModalVisible(true);
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

  const handleEditProfile = async (values) => {
    setLoading(true);
    try {
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const formData = new FormData();
      
      // Add file if exists
      if (fileList.length > 0) {
        formData.append('profilePicture', fileList[0].originFileObj);
      }
      
      // Add other form data
      formData.append('emailOrPhone', emailOrPhone);
      formData.append('fullName', values.fullName);
      formData.append('country', values.country);
      formData.append('enrollmentId', values.enrollmentId);
      formData.append('program', values.program);

      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/student/profile`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setProfile(res.data.profile);
      message.success('Profile updated successfully!');
      setEditModalVisible(false);
      form.resetFields();
      setFileList([]);
    } catch (err) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="view" onClick={showViewModal} icon={<EyeOutlined />}>
        View Profile
      </Menu.Item>
      <Menu.Item key="edit" onClick={showEditModal} icon={<EditOutlined />}>
        Edit Profile
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const firstName = profile?.fullName?.split(' ')[0] || 'Student';
  const avatarSrc = profile?.profilePicture || null;

  return (
    <div>
      <Row justify="end" align="middle" style={{ padding: 16 }}>
        <Dropdown overlay={menu} placement="bottomRight">
          <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Avatar src={avatarSrc} icon={!avatarSrc && <UserOutlined />} style={{ marginRight: 8 }} />
            <span>{firstName}</span>
          </span>
        </Dropdown>
      </Row>
    <Card style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
        <Title level={2}>Welcome, {firstName}</Title>
      <Paragraph>You are successfully logged in!</Paragraph>
      </Card>

      {/* View Profile Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
            <Title level={4} style={{ margin: 0 }}>Profile Details</Title>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            setViewModalVisible(false);
            showEditModal();
          }} icon={<EditOutlined />}>
            Edit Profile
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={580}
        centered
      >
        <div style={{ display: 'flex', padding: '20px 0' }}>
          {/* Left side - Profile Picture */}
          <div style={{ flex: '0 0 220px', textAlign: 'center' }}>
            {profile?.profilePicture ? (
              <div>
                <Image
                  src={profile.profilePicture}
                  alt="Profile Picture"
                  style={{ 
                    width: 180, 
                    height: 180, 
                    objectFit: 'cover', 
                    borderRadius: '50%',
                    border: '4px solid #f0f0f0'
                  }}
                  preview={{
                    maskClassName: 'customize-mask',
                    mask: <div style={{ color: 'white', fontSize: '14px' }}>
                      Click to view
                      <br />
                      (Zoom, Rotate & More)
                    </div>
                  }}
                />
              </div>
            ) : (
              <div>
                <Avatar 
                  icon={<UserOutlined />} 
                  size={180}
                  style={{ 
                    backgroundColor: '#f0f0f0',
                    border: '4px solid #e0e0e0'
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color="warning">Profile Picture Not Added</Tag>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Profile Info */}
          <div style={{ flex: 1, paddingLeft: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                {profile?.fullName || <Tag color="error">Name Not Added</Tag>}
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>
                {profile?.program ? (
                  <Tag color="blue" style={{ padding: '2px 12px' }}>{profile.program}</Tag>
                ) : (
                  <Tag color="error">Program Not Selected</Tag>
                )}
              </div>
            </div>

            <div style={{ 
              background: '#fafafa', 
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 14 }}>{profile?.email}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Phone Number</div>
                <div style={{ fontSize: 14 }}>{profile?.phone}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Country/Region</div>
                <div style={{ fontSize: 14 }}>
                  {profile?.country ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {countries.find(c => c.name.common === profile.country) && (
                        <img 
                          src={countries.find(c => c.name.common === profile.country).flags.png}
                          alt={profile.country}
                          style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
                        />
                      )}
                      {profile.country}
                    </div>
                  ) : (
                    <Tag color="error">Not Added</Tag>
                  )}
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Enrollment ID</div>
                <div style={{ fontSize: 14 }}>
                  {profile?.enrollmentId || <Tag color="error">Not Added</Tag>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Existing Edit Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditProfile}
        >
          <Form.Item 
            label="Profile Picture"
            extra="Max file size: 5MB. Supported formats: JPG, PNG, GIF"
          >
            <Upload
              beforeUpload={beforeUpload}
              fileList={fileList}
              onChange={({ fileList, file }) => {
                // Only update fileList if file passes validation
                if (file.status !== 'error') {
                  setFileList(fileList);
                }
              }}
              maxCount={1}
              accept="image/*"
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Change Picture</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Full name required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="country"
            label="Country/Region"
            rules={[{ required: true, message: 'Country required' }]}
          >
            <Select
              showSearch
              placeholder="Search and select your country"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const countryName = option?.label?.props?.children[1];
                return countryName?.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {countries.map((country) => (
                <Option 
                  key={country.name.common} 
                  value={country.name.common}
                  label={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={country.flags.png} 
                        alt={country.flags.alt || country.name.common}
                        style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
                      />
                      {country.name.common}
                    </div>
                  }
                >
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
            name="enrollmentId"
            label="Enrollment Id"
            // rules={[{ required: true, message: 'Enrollment Id required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="program"
            label="Program Enrolled"
            rules={[{ required: true, message: 'Program required' }]}
          >
            <Select>
              <Option value="24-session">24-session</Option>
              <Option value="48-session">48-session</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Save Changes
      </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentDashboard;