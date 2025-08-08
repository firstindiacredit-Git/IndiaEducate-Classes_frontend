import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Table, Button, Modal, Form, Input, Select, Popconfirm, message, Tag, Space, Avatar, Image } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useCountries } from '../../component/CountriesApi';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  TrophyOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const StudentManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [certificates, setCertificates] = useState([]);
  const { countries, loading: countriesLoading, renderCountryLabel } = useCountries();

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/students`);
      setStudents(res.data);
    } catch (err) {
      message.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all certificates
  const fetchCertificates = async () => {
    try {
      const emailOrPhone = localStorage.getItem('adminEmailOrPhone');
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/certificates/admin/requests`, {
        emailOrPhone
      });
      setCertificates(res.data);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCertificates();
  }, []);

  // Delete student
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/admin/students/${id}`);
      message.success('Student deleted successfully');
      fetchStudents(); // Refresh list
    } catch (err) {
      message.error('Failed to delete student');
    }
  };

  // Add new student
  const handleAddStudent = async (values) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/admin/add-student`, values);
      message.success('Student added successfully');
      setAddModalVisible(false);
      form.resetFields();
      fetchStudents(); // Refresh list
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to add student');
    }
  };

  // Handle edit student
  const handleEdit = async (values) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/admin/update-student/${selectedStudent._id}`,
        values
      );

      if (response.data && response.data.student) {
        message.success('Student updated successfully');
        setEditModalVisible(false);
        setSelectedStudent(null);
        editForm.resetFields();
        fetchStudents(); // Refresh list
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update student');
    }
  };

  // Show edit modal
  const showEditModal = (student) => {
    setSelectedStudent(student);
    editForm.setFieldsValue({
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      country: student.country,
      enrollmentId: student.enrollmentId,
      program: student.program
    });
    setEditModalVisible(true);
  };

  // Show view modal
  const showViewModal = (student) => {
    setSelectedStudent(student);
    setViewModalVisible(true);
  };

  // Find country object by name
  const findCountryByName = (countryName) => {
    return countries.find(country => country.name.common === countryName);
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
      title: 'Profile Picture',
      dataIndex: 'profilePicture',
      key: 'profilePicture',
      render: (profilePicture, record) => (
        <div onClick={() => showViewModal(record)} style={{ cursor: 'pointer' }}>
          {profilePicture ? (
            <Avatar 
              src={profilePicture} 
              size={50} 
              style={{ cursor: 'pointer' }}
            />
          ) : (
            <Avatar 
              icon={<UserOutlined />} 
              size={50} 
              style={{ cursor: 'pointer', backgroundColor: '#f0f0f0' }}
            />
          )}
        </div>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text) => text || <Tag color="warning">Not Set</Tag>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Country/Region',
      dataIndex: 'country',
      key: 'country',
      render: (countryName) => {
        if (!countryName) return <Tag color="warning">Not Set</Tag>;
        
        const country = findCountryByName(countryName);
        if (!country) return countryName;

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={country.flags.png}
              alt={country.flags.alt || country.name.common}
              style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
            />
            {countryName}
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'isVerified',
      dataIndex: 'isVerified',
      render: (isVerified) => (
        <Tag color={isVerified ? 'success' : 'error'}>
          {isVerified ? 'Verified' : 'Not Verified'}
        </Tag>
      ),
    },
    {
      title: 'Certificate',
      key: 'certificate',
      render: (_, record) => {
        const certificate = certificates.find(cert => cert.studentId?._id === record._id);
        
        if (!certificate) {
          return <Tag color="default" icon={<TrophyOutlined />}>Not Requested</Tag>;
        }
        
        if (certificate.isGenerated) {
          return <Tag color="success" icon={<TrophyOutlined />}>Generated</Tag>;
        }
        
        if (certificate.isAllowedByAdmin) {
          return <Tag color="processing" icon={<TrophyOutlined />}>Approved</Tag>;
        }
        
        return <Tag color="warning" icon={<TrophyOutlined />}>Pending</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          {/* <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          >
            Edit
          </Button> */}
          <Popconfirm
            title="Delete Student"
            description="Are you sure you want to delete this student?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
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
            <Title level={2} style={{ margin: 0 }}>Student Management</Title>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            Add Student
          </Button>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={students}
            rowKey="_id"
            loading={loading}
          />
        </Card>

        {/* Add Student Modal */}
        <Modal
          title="Add New Student"
          open={addModalVisible}
          onCancel={() => {
            setAddModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddStudent}
          >
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: 'Please input student name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please input email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please input phone number!' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input password!' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Form.Item
              name="program"
              label="Program"
            >
              <Select placeholder="Select program">
                <Option value="24-session">24 Session Program</Option>
                <Option value="48-session">48 Session Program</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="country"
              label="Country/Region"
            >
              <Select
                showSearch
                placeholder="Search and select country"
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
              name="enrollmentId"
              label="Enrollment ID"
            >
              <Input prefix={<IdcardOutlined />} placeholder="Enter enrollment ID" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Add Student
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Student Modal */}
        <Modal
          title="Edit Student"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedStudent(null);
            editForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEdit}
          >
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: 'Please input student name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please input email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone"
              rules={[
                { required: true, message: 'Please input phone number!' },
                { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' },
                { min: 10, message: 'Phone number must be at least 10 digits' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
              name="password"
              label="New Password (Optional)"
              extra="Leave blank to keep current password"
            >
              <Input.Password placeholder="Enter new password" />
            </Form.Item>

            <Form.Item
              name="program"
              label="Program"
              rules={[{ required: true, message: 'Please select a program!' }]}
            >
              <Select placeholder="Select program">
                <Option value="24-session">24 Session Program</Option>
                <Option value="48-session">48 Session Program</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="country"
              label="Country/Region"
            >
              <Select
                showSearch
                placeholder="Search and select country"
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
              name="enrollmentId"
              label="Enrollment ID"
            >
              <Input prefix={<IdcardOutlined />} placeholder="Enter enrollment ID" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Student
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* View Profile Modal */}
        <Modal
          title={
            <div style={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
              <Title level={4} style={{ margin: 0 }}>Student Profile Details</Title>
            </div>
          }
          open={viewModalVisible}
          onCancel={() => {
            setViewModalVisible(false);
            setSelectedStudent(null);
          }}
          footer={[
            <Button 
              key="edit" 
              type="primary" 
              onClick={() => {
                setViewModalVisible(false);
                showEditModal(selectedStudent);
              }} 
              icon={<EditOutlined />}
            >
              Edit Profile
            </Button>,
            <Button key="close" onClick={() => {
              setViewModalVisible(false);
              setSelectedStudent(null);
            }}>
              Close
            </Button>
          ]}
          width={580}
          centered
        >
          {selectedStudent && (
            <div style={{ display: 'flex', padding: '20px 0' }}>
              {/* Left side - Profile Picture */}
              <div style={{ flex: '0 0 220px', textAlign: 'center' }}>
                {selectedStudent.profilePicture ? (
                  <div>
                    <Image
                      src={selectedStudent.profilePicture}
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
                    {selectedStudent.fullName || <Tag color="error">Name Not Added</Tag>}
                  </div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    {selectedStudent.program ? (
                      <Tag color="blue" style={{ padding: '2px 12px' }}>{selectedStudent.program}</Tag>
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
                    <div style={{ fontSize: 14 }}>{selectedStudent.email}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Phone Number</div>
                    <div style={{ fontSize: 14 }}>{selectedStudent.phone}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Country/Region</div>
                    <div style={{ fontSize: 14 }}>
                      {selectedStudent.country ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {countries.find(c => c.name.common === selectedStudent.country) && (
                            <img
                              src={countries.find(c => c.name.common === selectedStudent.country).flags.png}
                              alt={selectedStudent.country}
                              style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
                            />
                          )}
                          {selectedStudent.country}
                        </div>
                      ) : (
                        <Tag color="error">Not Added</Tag>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Enrollment ID</div>
                    <div style={{ fontSize: 14 }}>
                      {selectedStudent.enrollmentId || <Tag color="error">Not Added</Tag>}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>Account Status</div>
                    <div style={{ fontSize: 14 }}>
                      <Tag color={selectedStudent.isVerified ? 'success' : 'error'}>
                        {selectedStudent.isVerified ? 'Verified' : 'Not Verified'}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default StudentManagement; 