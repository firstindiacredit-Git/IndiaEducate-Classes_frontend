import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  FileVideo,
  FileAudio,
  FileImage,
  Star,
  Clock,
  TrendingUp,
  Grid,
  List
} from 'lucide-react';
import axios from 'axios';
import {
  Input,
  Select,
  Button,
  Card,
  Tag,
  Badge,
  Row,
  Col,
  Pagination,
  Space,
  Tooltip,
  Modal,
  Tabs,
  Empty,
  Spin,
  Typography
} from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import StudentSidebar from './StudentSidebar';
const { Option } = Select;
const { TabPane } = Tabs;
const { Title } = Typography;

const FileLibrary = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    fileType: '',
    category: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [categories, setCategories] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['all', 'pdf', 'video', 'audio', 'image'];
    return tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'all';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Get student credentials from localStorage userProfile
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const studentEmailOrPhone = userProfile?.email || userProfile?.phone;

  // File type configurations
  const fileTypeConfig = {
    pdf: {
      icon: <FileText className="w-6 h-6 text-red-500" />,
      color: 'red',
      label: 'PDF'
    },
    video: {
      icon: <FileVideo className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      label: 'Video'
    },
    audio: {
      icon: <FileAudio className="w-6 h-6 text-green-500" />,
      color: 'green',
      label: 'Audio'
    },
    image: {
      icon: <FileImage className="w-6 h-6 text-purple-500" />,
      color: 'purple',
      label: 'Image'
    }
  };

  const categoryLabels = {
    study_material: 'Study Material',
    recorded_class: 'Recorded Class',
    pronunciation_practice: 'Pronunciation Practice',
    assignment: 'Assignment',
    other: 'Other'
  };

  useEffect(() => {
    fetchFilters();
    fetchFiles();
  }, [pagination.current, filters, activeTab]);

  // Update activeTab when URL parameters change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['all', 'pdf', 'video', 'audio', 'image'];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const fetchFilters = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/files/filters`);
      setCategories(response.data.categories);
      setFileTypes(response.data.fileTypes);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      let endpoint = '/files';
      let params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      // Handle different tabs
      switch (activeTab) {
        case 'pdf':
        case 'video':
        case 'audio':
        case 'image':
          endpoint = `/type/${activeTab}`;
          break;
        default:
          endpoint = '/files';
      }

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/files${endpoint}`, {
        params
      });

      setFiles(response.data.files);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.totalFiles || response.data.files.length
      }));
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/files/download/${fileId}`, {
        emailOrPhone: studentEmailOrPhone
      });

      // Get the download URL from response
      const downloadUrl = response.data.downloadUrl;

      // Open the download URL in a new tab/window
      // This will trigger the download with proper headers
      window.open(downloadUrl, '_blank');

    } catch (error) {
      console.error('Download failed:', error);
      // Show error message to user
      alert('Download failed. Please try again.');
    }
  };

  const handleViewFile = async (fileId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/files/file/${fileId}`, {
        params: { emailOrPhone: studentEmailOrPhone }
      });
      setSelectedFile(response.data.file);
      setFileModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch file details:', error);
    }
  };

  const handlePreviewFile = async (fileId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/files/file/${fileId}`, {
        params: { emailOrPhone: studentEmailOrPhone }
      });
      setSelectedFile(response.data.file);
      setPreviewModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch file details:', error);
    }
  };

  const renderFileCard = (file) => (
    <Card
      key={file._id}
      hoverable
      className="h-full cursor-pointer relative group"
      onClick={() => handleViewFile(file._id)}
    >
      {/* Action buttons overlay */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Space>
          <Tooltip title="Preview File">
            <Button
              type="primary"
              size="small"
              icon={<Eye className="w-3 h-3" />}
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewFile(file._id);
              }}
              className="shadow-md"
            />
          </Tooltip>
          <Tooltip title="Download File">
            <Button
              type="default"
              size="small"
              icon={<Download className="w-3 h-3" />}
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(file._id);
              }}
              className="shadow-md"
            />
          </Tooltip>
        </Space>
      </div>

      <div className="text-center pt-2">
        <div className="mb-4">
          {fileTypeConfig[file.fileType]?.icon || <FileText className="w-12 h-12 text-gray-500" />}
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 truncate text-sm" title={file.fileName}>
          {file.fileName}
        </h3>
        <p className="text-xs text-gray-500 mb-3 px-2" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4'
        }}>
          {file.description || 'No description available'}
        </p>
        <div className="space-y-2 mb-3">
          <Tag color={fileTypeConfig[file.fileType]?.color || 'default'} className="text-xs">
            {fileTypeConfig[file.fileType]?.label || file.fileType}
          </Tag>
          <Tag color="blue" className="text-xs">
            {categoryLabels[file.category] || file.category}
          </Tag>
        </div>
        <div className="text-xs text-gray-400">
          <div className="font-medium">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
        </div>
      </div>
    </Card>
  );

  const renderFileList = (file) => (
    <Card key={file._id} className="mb-3">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {fileTypeConfig[file.fileType]?.icon || <FileText className="w-6 h-6 text-gray-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{file.fileName}</h3>
          <p className="text-sm text-gray-500 truncate">
            {file.description || 'No description available'}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Tag color={fileTypeConfig[file.fileType]?.color || 'default'}>
              {fileTypeConfig[file.fileType]?.label || file.fileType}
            </Tag>
            <Tag color="blue">
              {categoryLabels[file.category] || file.category}
            </Tag>
            <span className="text-xs text-gray-400">
              {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Space>
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => handleViewFile(file._id)}
              />
            </Tooltip>
            <Tooltip title="Download">
              <Button
                type="text"
                icon={<Download className="w-4 h-4" />}
                onClick={() => handleDownload(file._id)}
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    </Card>
  );

  return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StudentNavbar />
      <StudentSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div style={{ maxWidth: '1900px', margin: '24px auto', padding: '0 24px', marginLeft: sidebarCollapsed ? '80px' : '250px', transition: 'margin-left 0.2s ease', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
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
            <Title level={2} style={{ margin: 0 }}>File Library</Title>
          </Space>
        </Row>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={(key) => {
          setActiveTab(key);
          setSearchParams({ tab: key });
        }}>
          <TabPane tab="All Files" key="all" />
          <TabPane tab="PDFs" key="pdf" />
          <TabPane tab="Videos" key="video" />
          <TabPane tab="Audio" key="audio" />
          <TabPane tab="Images" key="image" />
        </Tabs>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
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
              {fileTypes.map(type => (
                <Option key={type} value={type}>
                  {fileTypeConfig[type]?.label || type}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Category"
              value={filters.category}
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              style={{ width: 150 }}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>
                  {categoryLabels[cat] || cat}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Sort By"
              value={filters.sortBy}
              onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
              style={{ width: 120 }}
            >
              <Option value="createdAt">Date</Option>
              <Option value="viewCount">Views</Option>
              <Option value="downloadCount">Downloads</Option>
            </Select>
            <Button
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setFilters({ fileType: '', category: '', search: '', sortBy: 'createdAt', sortOrder: 'desc' })}
            >
              Clear
            </Button>
            <div className="ml-auto">
              <Space>
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<Grid className="w-4 h-4" />}
                  onClick={() => setViewMode('grid')}
                />
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<List className="w-4 h-4" />}
                  onClick={() => setViewMode('list')}
                />
              </Space>
            </div>
          </div>
        </Card>
        {/* Files Display */}
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <Empty
            description="No files found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            {viewMode === 'grid' ? (
              <Row gutter={[16, 16]}>
                {files.map(file => (
                  <Col key={file._id} xs={24} sm={12} md={8} lg={6}>
                    {renderFileCard(file)}
                  </Col>
                ))}
              </Row>
            ) : (
              <div>
                {files.map(file => renderFileList(file))}
              </div>
            )}

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="mt-6 text-center">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>



      {/* File Details Modal */}
      <Modal
        title="File Details"
        open={fileModalVisible}
        onCancel={() => setFileModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFileModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="preview"
            type="default"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => {
              if (selectedFile) {
                setFileModalVisible(false);
                setPreviewModalVisible(true);
              }
            }}
          >
            Preview
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => {
              if (selectedFile) {
                handleDownload(selectedFile._id);
                setFileModalVisible(false);
              }
            }}
          >
            Download
          </Button>
        ]}
        width={600}
      >
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {fileTypeConfig[selectedFile.fileType]?.icon || <FileText className="w-8 h-8" />}
              <div>
                <h3 className="text-lg font-medium">{selectedFile.fileName}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded by {selectedFile.uploadedBy?.fullName || 'Unknown'}
                </p>
              </div>
            </div>

            {selectedFile.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedFile.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h4 className="font-medium mb-2">File Information</h4>
                <div className="space-y-1 text-sm">
                  <div>Type: <Tag color={fileTypeConfig[selectedFile.fileType]?.color || 'default'}>
                    {fileTypeConfig[selectedFile.fileType]?.label || selectedFile.fileType}
                  </Tag></div>
                  <div>Category: <Tag color="blue">{categoryLabels[selectedFile.category] || selectedFile.category}</Tag></div>
                  <div>Size: {(selectedFile.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                  <div>Uploaded: {new Date(selectedFile.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {selectedFile.tags && selectedFile.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedFile.tags.map((tag, index) => (
                    <Tag key={index} color="green">{tag}</Tag>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                type="primary"
                block
                icon={<Download className="w-4 h-4" />}
                onClick={() => handleDownload(selectedFile._id)}
              >
                Download File
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* File Preview Modal */}
      <Modal
        title={`File Preview - ${selectedFile?.fileName}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => {
              if (selectedFile) {
                handleDownload(selectedFile._id);
                setPreviewModalVisible(false);
              }
            }}
          >
            Download
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        {selectedFile && (
          <div className="w-full">
            {selectedFile.fileType === 'pdf' && (
              <iframe
                src={selectedFile.s3Url}
                width="100%"
                height="500px"
                style={{ border: 'none' }}
                title={selectedFile.fileName}
              />
            )}
            {selectedFile.fileType === 'video' && (
              <video
                controls
                width="100%"
                height="auto"
                style={{ maxHeight: '500px' }}
              >
                <source src={selectedFile.s3Url} type={selectedFile.mimeType} />
                Your browser does not support the video tag.
              </video>
            )}
            {selectedFile.fileType === 'audio' && (
              <div className="text-center p-8">
                <audio controls style={{ width: '100%' }}>
                  <source src={selectedFile.s3Url} type={selectedFile.mimeType} />
                  Your browser does not support the audio tag.
                </audio>
                <p className="mt-4 text-gray-600">{selectedFile.fileName}</p>
              </div>
            )}
            {selectedFile.fileType === 'image' && (
              <div className="text-center">
                <img
                  src={selectedFile.s3Url}
                  alt={selectedFile.fileName}
                  style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                />
              </div>
            )}
            {!['pdf', 'video', 'audio', 'image'].includes(selectedFile.fileType) && (
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                <Button
                  type="primary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => handleDownload(selectedFile._id)}
                >
                  Download File
                </Button>
              </div>
            )}

            {/* File Details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">File Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedFile.fileName}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedFile.fileType?.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {(selectedFile.fileSize / (1024 * 1024)).toFixed(2)} MB
                </div>
                {selectedFile.description && (
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {selectedFile.description}
                  </div>
                )}
                {selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium">Tags:</span> {selectedFile.tags.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileLibrary; 