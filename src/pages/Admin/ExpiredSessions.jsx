import React, { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Space, Button, Modal, Descriptions, Divider, message, Alert, Row } from 'antd';
import { HistoryOutlined, WarningOutlined, SyncOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import axios from 'axios';
import moment from 'moment';

const { Title } = Typography;

const ExpiredSessions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expiredSessions, setExpiredSessions] = useState([]);
  const [selectedExpiredSession, setSelectedExpiredSession] = useState(null);
  const [expiredSessionDetailModalVisible, setExpiredSessionDetailModalVisible] = useState(false);

  // Function to format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} minutes` : ''}`;
  };

  // Function to manually check for expired classes
  const checkExpiredClasses = async () => {
    try {
      message.loading('Checking for expired classes...', 1);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/classes/check-expired`);
      
      // Refresh data
      await fetchExpiredSessions();

      message.success(`${response.data.message}`);
    } catch (err) {
      console.error('Error checking expired classes:', err);
      message.error('Failed to check expired classes');
    }
  };

  // Fetch expired sessions
  const fetchExpiredSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/expired-sessions`);
      console.log('Expired sessions:', response.data);
      setExpiredSessions(response.data.sessions);
    } catch (err) {
      console.error('Error fetching expired sessions:', err);
      message.error('Failed to fetch expired sessions');
    } finally {
      setLoading(false);
    }
  };

  // Show expired session details
  const showExpiredSessionDetails = (session) => {
    setSelectedExpiredSession(session);
    setExpiredSessionDetailModalVisible(true);
  };

  useEffect(() => {
    fetchExpiredSessions();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchExpiredSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Expired sessions columns
  const expiredSessionsColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
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
      title: 'Scheduled Start',
      dataIndex: 'formattedStartTime',
      key: 'formattedStartTime',
    },
    {
      title: 'Scheduled End',
      dataIndex: 'formattedScheduledEndTime',
      key: 'formattedScheduledEndTime',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => formatDuration(duration),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="default"
          onClick={() => showExpiredSessionDetails(record)}
          icon={<HistoryOutlined />}
        >
          View Details
        </Button>
      ),
    }
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
            <Title level={2} style={{ margin: 0 }}>Expired Sessions</Title>
          </Space>
          <Button
            type="primary"
            onClick={checkExpiredClasses}
            icon={<SyncOutlined />}
          >
            Check for Expired Classes
          </Button>
        </Row>

        <Alert
          message="These sessions were not started at their scheduled time"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card>
          <Table
            loading={loading}
            columns={expiredSessionsColumns}
            dataSource={expiredSessions}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Expired Session Detail Modal */}
        <Modal
          title={
            <Space>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <span>Expired Session Details</span>
            </Space>
          }
          open={expiredSessionDetailModalVisible}
          onCancel={() => {
            setExpiredSessionDetailModalVisible(false);
            setSelectedExpiredSession(null);
          }}
          width={700}
          footer={[
            <Button 
              key="close" 
              type="primary"
              onClick={() => {
                setExpiredSessionDetailModalVisible(false);
                setSelectedExpiredSession(null);
              }}
            >
              Close
            </Button>
          ]}
        >
          {selectedExpiredSession && (
            <>
              <Alert
                message="This session was not started at the scheduled time"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Session Title">
                  {selectedExpiredSession.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {selectedExpiredSession.description || 'No description provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Program">
                  <Tag color={selectedExpiredSession.program === '24-session' ? 'blue' : 'purple'}>
                    {selectedExpiredSession.program}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Scheduled Timing</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Scheduled Start">
                  {selectedExpiredSession.formattedStartTime}
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled End">
                  {selectedExpiredSession.formattedScheduledEndTime}
                </Descriptions.Item>
                <Descriptions.Item label="Duration">
                  {formatDuration(selectedExpiredSession.duration)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Additional Information</Divider>

              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{ fontWeight: 'bold', width: '150px' }}
              >
                <Descriptions.Item label="Status">
                  <Tag color="red">EXPIRED</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {moment(selectedExpiredSession.createdAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {moment(selectedExpiredSession.updatedAt).format('MMMM Do YYYY, h:mm a')}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ExpiredSessions; 