import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Trash,
  Edit,
  Eye,
  Download,
  Search,
  Filter,
  Plus,
  FileVideo,
  FileAudio,
  FileImage
} from 'lucide-react';
import axios from 'axios';
import { message, Upload as AntUpload, Button, Card, Input, Select, Tag, Modal, Form, InputNumber, Switch, Table, Pagination, Space, Tooltip, Badge, Row, Col, Typography, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import AdminNavbar from '../Admin/AdminNavbar';
import AdminSidebar from './AdminSidebar';
const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Content } = Layout;

const FileUpload = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('pdf');
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    fileType: '',
    category: '',
    search: ''
  });
  const [stats, setStats] = useState({});

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Get admin email from localStorage userProfile
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const adminEmailOrPhone = userProfile?.email || userProfile?.phone;

  // File type configurations
  const fileTypeConfig = {
    pdf: {
      title: 'PDF Upload',
      icon: <FileText className="w-6 h-6 text-red-500" />,
      accept: '.pdf',
      maxSize: 50,
      description: 'Upload study materials, assignments, and documents'
    },
    video: {
      title: 'Video Upload',
      icon: <FileVideo className="w-6 h-6 text-blue-500" />,
      accept: '.mp4,.avi,.mov,.wmv,.flv,.webm',
      maxSize: 500,
      description: 'Upload recorded classes and educational videos'
    },
    audio: {
      title: 'Audio Upload',
      icon: <FileAudio className="w-6 h-6 text-green-500" />,
      accept: '.mp3,.wav,.ogg,.m4a,.aac',
      maxSize: 100,
      description: 'Upload pronunciation practice and audio lessons'
    },
    image: {
      title: 'Image Upload',
      icon: <FileImage className="w-6 h-6 text-purple-500" />,
      accept: '.jpg,.jpeg,.png,.gif,.webp',
      maxSize: 10,
      description: 'Upload images and visual content'
    }
  };

  const categories = [
    { value: 'study_material', label: 'Study Material' },
    { value: 'recorded_class', label: 'Recorded Class' },
    { value: 'pronunciation_practice', label: 'Pronunciation Practice' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Check if email exists
    if (!adminEmailOrPhone) {
      console.error('No admin email found in userProfile');
      message.error('Admin authentication failed. Please login again.');
      return;
    }

    fetchFiles();
    fetchStats();
  }, [pagination.current, filters, adminEmailOrPhone]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/files/admin-files`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          'admin-email': userProfile.email,
          'admin-phone': userProfile.phone
        }
      });

      setFiles(response.data.files);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.totalFiles
      }));
    } catch (error) {
      message.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/admin/files/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-email': userProfile.email,
          'admin-phone': userProfile.phone
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUpload = async (values) => {
    if (!fileList.length) {
      message.error('Please select a file to upload');
      return;
    }

    if (!userProfile.email && !userProfile.phone) {
      message.error('Admin authentication failed. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('category', values.category);
      formData.append('description', values.description || '');
      formData.append('tags', values.tags || '');
      formData.append('isPublic', values.isPublic || true);

      let endpoint = '';
      switch (uploadType) {
        case 'pdf':
          endpoint = '/upload-pdf';
          break;
        case 'video':
          endpoint = '/upload-video';
          break;
        case 'audio':
          endpoint = '/upload-audio';
          break;
        case 'image':
          endpoint = '/upload-image';
          break;
        default:
          endpoint = '/upload-file';
      }
      

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/admin/files${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'admin-email': userProfile.email,
            'admin-phone': userProfile.phone
          },
        }
      );

      message.success('File uploaded successfully!');
      
      // Show notification about students being notified if file is public
      if (values.isPublic !== false) {
        message.info('Students have been notified about the new study material.');
      }
      
      setUploadModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchFiles();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/admin/files/file/${selectedFile._id}`,
        {
          ...values
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'admin-email': userProfile.email,
            'admin-phone': userProfile.phone
          }
        }
      );

      message.success('File updated successfully!');
      setEditModalVisible(false);
      editForm.resetFields();
      setSelectedFile(null);
      fetchFiles();
    } catch (error) {
      message.error('Failed to update file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/admin/files/file/${fileId}`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-email': userProfile.email,
          'admin-phone': userProfile.phone
        }
      });

      message.success('File deleted successfully!');
      fetchFiles();
      fetchStats();
    } catch (error) {
      message.error('Failed to delete file');
    }
  };

  const beforeUpload = (file) => {
    const config = fileTypeConfig[uploadType];
    
    // Check if file extension matches the selected upload type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const acceptedExtensions = config.accept.split(',').map(ext => ext.replace('.', '').toLowerCase());
    
    const isValidType = acceptedExtensions.includes(fileExtension);

    if (!isValidType) {
      message.error(`Please select a valid ${uploadType} file! Allowed extensions: ${config.accept}`);
      return false;
    }

    const isLessThanMaxSize = file.size <= config.maxSize * 1024 * 1024;
    if (!isLessThanMaxSize) {
      message.error(`${uploadType.toUpperCase()} must be smaller than ${config.maxSize}MB!`);
      return false;
    }

    return true;
  };

  const columns = [
    {
      title: 'File',
      key: 'file',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {fileTypeConfig[record.fileType]?.icon || <FileText className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {record.fileName}
            </p>
            <p className="text-xs text-gray-500">
              {(record.fileSize / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{categories.find(c => c.value === category)?.label || category}</Tag>
      ),
    },
    {
      title: 'Views',
      dataIndex: 'viewCount',
      key: 'viewCount',
      render: (count) => <Badge count={count} showZero />,
    },
    {
      title: 'Downloads',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      render: (count) => <Badge count={count} showZero />,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isPublic ? 'green' : 'orange'}>
          {record.isPublic ? 'Public' : 'Private'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => {
                setSelectedFile(record);
                setPreviewModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => {
                setSelectedFile(record);
                editForm.setFieldsValue({
                  fileName: record.fileName,
                  description: record.description,
                  category: record.category,
                  tags: record.tags.join(', '),
                  isPublic: record.isPublic
                });
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<Trash className="w-4 h-4" />}
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
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
              <Title level={2} style={{ margin: 0 }}>File Management</Title>
            </Space>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setUploadType(null);
                setUploadModalVisible(true);
              }}
            >
              Upload File
            </Button>
          </Row>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Files</p>
                  <p className="text-xl font-semibold">{stats.totalFiles || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-xl font-semibold">{stats.totalViews || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <Download className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Downloads</p>
                  <p className="text-xl font-semibold">{stats.totalDownloads || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <Upload className="w-8 h-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Size</p>
                  <p className="text-xl font-semibold">
                    {stats.totalSize ? `${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search files..."
                prefix={<Search className="w-4 h-4" />}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                style={{ width: 200 }}
              />
              <Select
                placeholder="File Type"
                value={filters.fileType}
                onChange={(value) => setFilters(prev => ({ ...prev, fileType: value }))}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="pdf">PDF</Option>
                <Option value="video">Video</Option>
                <Option value="audio">Audio</Option>
                <Option value="image">Image</Option>
              </Select>
              <Select
                placeholder="Category"
                value={filters.category}
                onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                style={{ width: 150 }}
                allowClear
              >
                {categories.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
              <Button
                icon={<Filter className="w-4 h-4" />}
                onClick={() => setFilters({ fileType: '', category: '', search: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Files Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={files}
              rowKey="_id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page) => setPagination(prev => ({ ...prev, current: page })),
                showSizeChanger: false
              }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default FileUpload; 