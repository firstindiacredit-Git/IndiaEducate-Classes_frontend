import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Space, Button, Modal, Descriptions, Divider, message, Form, Input, DatePicker, Select, Row } from 'antd';
import { VideoCameraOutlined, EditOutlined, HistoryOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import moment from 'moment';
import JitsiMeeting from '../../component/JitsiMeeting';

const { Title, Text } = Typography;
const { Option } = Select;

const UpcomingSessions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [selectedUpcomingSession, setSelectedUpcomingSession] = useState(null);
  const [upcomingSessionDetailModalVisible, setUpcomingSessionDetailModalVisible] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  const [jitsiModalVisible, setJitsiModalVisible] = useState(false);

  // Function to format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} minutes` : ''}`;
  };

  // Function to check class status
  const checkClassStatus = (classData) => {
    const now = new Date();
    const startTime = new Date(classData.startTime);
    const endTime = new Date(startTime.getTime() + (classData.duration * 60000));

    if (now > endTime) {
      return classData.status === 'ongoing' ? 'completed' : 'expired';
    }
    return classData.status;
  };

  // Fetch upcoming classes
  const fetchUpcomingClasses = async () => {
    try {
      console.log('Fetching upcoming classes...');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/upcoming/all`);
      
      // Check if any active class has ended
      if (activeClass) {
        const status = checkClassStatus(activeClass);
        if (status === 'completed') {
          setJitsiModalVisible(false);
          setActiveClass(null);
          message.info('Class has ended due to duration completion');
        }
      }

      setUpcomingClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      message.error('Failed to fetch upcoming classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingClasses();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUpcomingClasses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Start class meeting
  const handleStartClass = async (classId) => {
    try {
      console.log('Starting class:', classId);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/start/${classId}`);
      const { meetingLink } = response.data.schedule;
      setActiveClass(response.data.schedule);
      setJitsiModalVisible(true);
      fetchUpcomingClasses(); // Refresh the list
      message.success('Class started successfully');
    } catch (err) {
      console.error('Error starting class:', err);
      message.error('Failed to start class');
    }
  };

  // End class meeting
  const handleEndClass = async (classId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/end/${classId}`);
      message.success('Class ended successfully');
      setJitsiModalVisible(false);
      setActiveClass(null);
      fetchUpcomingClasses();
    } catch (err) {
      console.error('Error ending class:', err);
      message.error('Failed to end class');
    }
  };

  // Join ongoing class
  const handleJoinClass = (classData) => {
    setActiveClass(classData);
    setJitsiModalVisible(true);
  };

  // Show edit modal
  const showEditModal = (classData) => {
    setSelectedClass(classData);
    editForm.setFieldsValue({
      ...classData,
      startTime: moment(classData.startTime)
    });
    setEditModalVisible(true);
  };

  // Handle edit class
  const handleEditClass = async (values) => {
    try {
      if (!selectedClass?._id) {
        message.error('No class selected for editing');
        return;
      }

      // Convert duration to number
      const duration = parseInt(values.duration);
      if (isNaN(duration) || duration < 5 || duration > 180) {
        message.error('Duration must be between 5 and 180 minutes');
        return;
      }

      // Validate that the start time is in the future
      const startTime = values.startTime.toDate();
      if (startTime < new Date()) {
        message.error('Cannot schedule class in the past');
        return;
      }

      console.log('Editing class with values:', values);
      const payload = {
        ...values,
        duration: duration,
        startTime: startTime.toISOString()
      };
      console.log('Sending payload:', payload);

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/classes/update/${selectedClass._id}`,
        payload
      );
      console.log('Class updated response:', response.data);
      
      message.success('Class updated successfully');
      setEditModalVisible(false);
      setSelectedClass(null);
      editForm.resetFields();
      fetchUpcomingClasses();
    } catch (err) {
      console.error('Error updating class:', err);
      message.error(err.response?.data?.message || 'Failed to update class');
    }
  };

  // Show session details
  const showUpcomingSessionDetails = (session) => {
    setSelectedUpcomingSession(session);
    setUpcomingSessionDetailModalVisible(true);
  };

  const classColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: 70,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (startTime) => moment(startTime).format('MMMM Do YYYY, h:mm a'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => formatDuration(duration),
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
      render: (program) => (
        <Tag color={program === '24-session' ? 'blue' : 'purple'}>
          {program}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (record.status === 'ongoing') {
          return (
            <Space direction="vertical" size="small">
              <Tag color="green">IN PROGRESS</Tag>
              {record.remainingTime > 0 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {record.remainingTime} min remaining
                </Text>
              )}
            </Space>
          );
        }
        return (
          <Tag color={record.status === 'scheduled' ? 'blue' : 'red'}>
            {record.status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            onClick={() => showUpcomingSessionDetails(record)}
            icon={<HistoryOutlined />}
          >
            View Details
          </Button>
          {record.status === 'scheduled' && (
            <>
              <Button 
                type="primary" 
                icon={<VideoCameraOutlined />}
                onClick={() => handleStartClass(record._id)}
              >
                Start Class
              </Button>
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => showEditModal(record)}
              >
                Edit
              </Button>
            </>
          )}
          {record.status === 'ongoing' && (
            <Button 
              type="primary" 
              onClick={() => handleJoinClass(record)}
              icon={<VideoCameraOutlined />}
            >
              Join Class
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Space>
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
            <Title level={2} style={{ margin: 0 }}>Upcoming Sessions</Title>
          </Space>
        </Row>

        <Card>
          <Table
            loading={loading}
            columns={classColumns}
            dataSource={upcomingClasses}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Edit Class Modal */}
        <Modal
          title="Edit Class"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedClass(null);
            editForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditClass}
          >
            <Form.Item
              name="title"
              label="Class Title"
              rules={[{ required: true, message: 'Please enter class title' }]}
            >
              <Input placeholder="Enter class title" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea placeholder="Enter class description" />
            </Form.Item>

            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[
                { required: true, message: 'Please select start time' },
                {
                  validator: (_, value) => {
                    if (value && value.toDate() < new Date()) {
                      return Promise.reject('Cannot schedule class in the past');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                disabledDate={(current) => current && current < moment().startOf('day')}
                disabledTime={(current) => {
                  if (current && current.isSame(moment(), 'day')) {
                    return {
                      disabledHours: () => Array.from({ length: moment().hour() }, (_, i) => i),
                      disabledMinutes: (hour) => {
                        if (hour === moment().hour()) {
                          return Array.from({ length: moment().minute() }, (_, i) => i);
                        }
                        return [];
                      }
                    };
                  }
                  return {};
                }}
              />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (minutes)"
              rules={[
                { required: true, message: 'Please enter duration' },
                { 
                  validator: async (_, value) => {
                    const duration = parseInt(value);
                    if (isNaN(duration) || duration < 5 || duration > 180) {
                      throw new Error('Duration must be between 5 and 180 minutes');
                    }
                  }
                }
              ]}
            >
              <Input 
                type="number" 
                min={5} 
                max={180} 
                placeholder="Enter duration in minutes"
              />
            </Form.Item>

            <Form.Item
              name="program"
              label="Program"
              rules={[{ required: true, message: 'Please select program' }]}
            >
              <Select placeholder="Select program">
                <Option value="24-session">24 Session Program</Option>
                <Option value="48-session">48 Session Program</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Class
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Upcoming Session Detail Modal */}
        <Modal
          title={
            <Space>
              <ClockCircleOutlined />
              <span>Session Details</span>
            </Space>
          }
          open={upcomingSessionDetailModalVisible}
          onCancel={() => {
            setUpcomingSessionDetailModalVisible(false);
            setSelectedUpcomingSession(null);
          }}
          width={700}
          footer={[
            <Button 
              key="close" 
              type="primary"
              onClick={() => {
                setUpcomingSessionDetailModalVisible(false);
                setSelectedUpcomingSession(null);
              }}
            >
              Close
            </Button>
          ]}
        >
          {selectedUpcomingSession && (
            <>
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Session Title">
                  {selectedUpcomingSession.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedUpcomingSession.description || 'No description provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color={selectedUpcomingSession.program === '24-session' ? 'blue' : 'purple'}>
                    {selectedUpcomingSession.program}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Timing Details</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Start Time">
                  {moment(selectedUpcomingSession.startTime).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Expected End Time">
                  {moment(selectedUpcomingSession.startTime).add(selectedUpcomingSession.duration, 'minutes').format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {formatDuration(selectedUpcomingSession.duration)}
                </Descriptions.Item>
                {selectedUpcomingSession.status === 'ongoing' && selectedUpcomingSession.remainingTime > 0 && (
                  <Descriptions.Item label="Remaining Time">
                    {formatDuration(selectedUpcomingSession.remainingTime)}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider orientation="left">Session Status</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Status">
                  <Tag color={
                    selectedUpcomingSession.status === 'scheduled' ? 'blue' : 
                    selectedUpcomingSession.status === 'ongoing' ? 'green' : 'red'
                  }>
                    {selectedUpcomingSession.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {moment(selectedUpcomingSession.createdAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {moment(selectedUpcomingSession.updatedAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
              </Descriptions>

              {selectedUpcomingSession.status === 'ongoing' && selectedUpcomingSession.meetingLink && (
                <>
                  <Divider orientation="left">Meeting Details</Divider>
                  <Descriptions
                    bordered
                    column={1}
                    size="small"
                    labelStyle={{ fontWeight: 'bold', width: '150px' }}
                  >
                    <Descriptions.Item label="Meeting Link">
                      <Button 
                        type="primary" 
                        href={selectedUpcomingSession.meetingLink}
                        target="_blank"
                        icon={<VideoCameraOutlined />}
                      >
                        Join Meeting
                      </Button>
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </>
          )}
        </Modal>

        {/* Jitsi Meeting Modal */}
        <JitsiMeeting
          isOpen={jitsiModalVisible}
          onClose={() => setJitsiModalVisible(false)}
          meetingLink={activeClass?.meetingLink}
          classId={activeClass?._id}
          isAdmin={true}
          onEndClass={handleEndClass}
        />
      </div>
    </div>
  );
};

export default UpcomingSessions; 