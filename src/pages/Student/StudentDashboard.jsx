import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Row, Col, Progress, Space, Table, Tag, message, Empty, Divider, Modal, Tooltip } from 'antd';
import { useAuth } from '../../component/AuthProvider';
import { useSocket } from '../../component/SocketProvider';
import moment from 'moment';
import {
  FilePdfOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  TrophyOutlined,
  LineChartOutlined,
  QuestionCircleOutlined,
  MailOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import StudentNavbar from './StudentNavbar';
import axios from 'axios';

const { Title, Text } = Typography;

// Custom Calendar Component
const CustomCalendar = ({ classes, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedDateClasses, setSelectedDateClasses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, completed
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  // Get calendar days for current month
  const getCalendarDays = () => {
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');

    const days = [];
    let day = startDate.clone();

    while (day.isBefore(endDate)) {
      days.push(day.clone());
      day.add(1, 'day');
    }

    return days;
  };

  // Get classes for a specific date
  const getClassesForDate = (date) => {
    let filteredClasses = classes.filter(cls => {
      const classDate = moment(cls.startTime);
      return classDate.isSame(date, 'day');
    });

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredClasses = filteredClasses.filter(cls => cls.status === statusFilter);
    }

    return filteredClasses;
  };

  // Get date status (scheduled, completed, current)
  const getDateStatus = (date) => {
    const dateClasses = getClassesForDate(date);
    const isCurrentDate = date.isSame(moment(), 'day');

    if (isCurrentDate) return 'current';
    if (dateClasses.length === 0) return 'empty';

    const hasScheduled = dateClasses.some(cls => cls.status === 'scheduled');
    const hasCompleted = dateClasses.some(cls => cls.status === 'completed');

    if (hasCompleted) return 'completed';
    if (hasScheduled) return 'scheduled';
    return 'empty';
  };

  // Handle date click
  const handleDateClick = (date) => {
    const dateClasses = getClassesForDate(date);
    if (dateClasses.length > 0) {
      setSelectedDate(date);
      setSelectedDateClasses(dateClasses);
      setDateModalVisible(true);
    }
  };

  // Get date background color
  const getDateBackgroundColor = (date) => {
    const status = getDateStatus(date);
    switch (status) {
      case 'current': return '#1890ff';
      case 'scheduled': return '#faad14';
      case 'completed': return '#52c41a';
      default: return 'transparent';
    }
  };

  // Get date text color
  const getDateTextColor = (date) => {
    const status = getDateStatus(date);
    switch (status) {
      case 'empty': return '#000000';
      default: return '#ffffff';
    }
  };

  // Get tooltip text
  const getTooltipText = (date) => {
    const status = getDateStatus(date);
    const dateClasses = getClassesForDate(date);

    if (status === 'current') return 'Current Date';
    if (dateClasses.length === 0) return 'No classes';

    const scheduledCount = dateClasses.filter(cls => cls.status === 'scheduled').length;
    const completedCount = dateClasses.filter(cls => cls.status === 'completed').length;

    let tooltip = '';
    if (scheduledCount > 0) tooltip += `${scheduledCount} Scheduled`;
    if (completedCount > 0) {
      if (tooltip) tooltip += ', ';
      tooltip += `${completedCount} Completed`;
    }

    return tooltip;
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Button
            icon={<CalendarOutlined />}
            onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
          >
            Previous
          </Button>
          <div style={{ textAlign: 'center' }}>
            <Button
              type="link"
              style={{ fontSize: '22px', fontWeight: 'bold', padding: '0 0px', color: '#000000' }}
              onClick={() => setMonthModalVisible(true)}
            >
              {currentMonth.format('MMMM')}
            </Button>
            <Button
              type="link"
              style={{ fontSize: '16px', fontWeight: 'bold', padding: '0 4px', color: '#000000' }}
              onClick={() => setYearModalVisible(true)}
            >
              {currentMonth.format('YYYY')}
            </Button>
          </div>
          <Button
            icon={<CalendarOutlined />}
            onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
          >
            Next
          </Button>
        </Row>

        {/* Status Filter Buttons */}
        <Row justify="center" style={{ marginTop: '12px' }}>
          <Space>
            <Button
              size="small"
              onClick={() => setStatusFilter('all')}
              type={statusFilter === 'all' ? 'primary' : 'default'}
            >
              All Classes
            </Button>
            <Button
              size="small"
              onClick={() => setStatusFilter('scheduled')}
              type={statusFilter === 'scheduled' ? 'primary' : 'default'}
              style={{ backgroundColor: statusFilter === 'scheduled' ? '#faad14' : undefined, borderColor: '#faad14', color: statusFilter === 'scheduled' ? '#fff' : '#faad14' }}
            >
              Scheduled
            </Button>
            <Button
              size="small"
              onClick={() => setStatusFilter('completed')}
              type={statusFilter === 'completed' ? 'primary' : 'default'}
              style={{ backgroundColor: statusFilter === 'completed' ? '#52c41a' : undefined, borderColor: '#52c41a', color: statusFilter === 'completed' ? '#fff' : '#52c41a' }}
            >
              Completed
            </Button>
          </Space>
        </Row>
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Week days header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{
              padding: '8px 4px',
              textAlign: 'center',
              fontWeight: 'bold',
              borderRight: '1px solid #f0f0f0',
              fontSize: '12px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.isSame(currentMonth, 'month');
            const status = getDateStatus(day);
            const hasClasses = getClassesForDate(day).length > 0;

            return (
              <Tooltip key={index} title={getTooltipText(day)}>
                <div
                  style={{
                    padding: '6px 4px',
                    textAlign: 'center',
                    cursor: hasClasses ? 'pointer' : 'default',
                    backgroundColor: getDateBackgroundColor(day),
                    color: getDateTextColor(day),
                    borderRight: '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0',
                    opacity: isCurrentMonth ? 1 : 0.3,
                    minHeight: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onClick={() => hasClasses && handleDateClick(day)}
                >
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {day.format('D')}
                  </div>
                  {hasClasses && (
                    <div style={{
                      fontSize: '8px',
                      marginTop: '1px',
                      opacity: 0.8
                    }}>
                      {getClassesForDate(day).length} class{getClassesForDate(day).length > 1 ? 'es' : ''}
                    </div>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Date Classes Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Classes on {selectedDate?.format('MMMM DD, YYYY')}</span>
          </Space>
        }
        open={dateModalVisible}
        onCancel={() => setDateModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedDateClasses.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {selectedDateClasses.map((cls) => (
              <div key={cls._id} style={{
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                marginBottom: '12px'
              }}>
                <Row justify="space-between" align="middle">
                  <Col span={16}>
                    <Text strong style={{ fontSize: '16px' }}>{cls.title}</Text>
                    <br />
                    <Text type="secondary">
                      {moment(cls.startTime).format('h:mm A')} • {cls.duration} minutes
                    </Text>
                    <br />
                    <Text type="secondary">
                      {cls.description || 'No description available'}
                    </Text>
                  </Col>
                  <Col span={8} style={{ textAlign: 'right' }}>
                    {cls.status === 'scheduled' && (
                      <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                        SCHEDULED
                      </Tag>
                    )}
                    {cls.status === 'completed' && (
                      <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                        COMPLETED
                      </Tag>
                    )}
                    {cls.status === 'ongoing' && (
                      <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                        ONGOING
                      </Tag>
                    )}
                  </Col>
                </Row>
              </div>
            ))}
          </Space>
        ) : (
          <Empty description="No classes on this date" />
        )}
      </Modal>

      {/* Month Selection Modal */}
      <Modal
        title="Select Month"
        open={monthModalVisible}
        onCancel={() => setMonthModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {moment.months().map((month, index) => (
            <Button
              key={month}
              type={currentMonth.month() === index ? 'primary' : 'default'}
              style={{ height: '40px' }}
              onClick={() => {
                setCurrentMonth(currentMonth.month(index));
                setMonthModalVisible(false);
              }}
            >
              {month}
            </Button>
          ))}
        </div>
      </Modal>

      {/* Year Selection Modal */}
      <Modal
        title="Select Year"
        open={yearModalVisible}
        onCancel={() => setYearModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {Array.from({ length: 10 }, (_, i) => {
            const year = moment().year() - 2 + i;
            return (
              <Button
                key={year}
                type={currentMonth.year() === year ? 'primary' : 'default'}
                style={{ height: '40px' }}
                onClick={() => {
                  setCurrentMonth(currentMonth.year(year));
                  setYearModalVisible(false);
                }}
              >
                {year}
              </Button>
            );
          })}
        </div>
      </Modal>

    </>
  );
};

const StudentDashboard = () => {
  const { profile } = useAuth();
  const { socket, isConnected } = useSocket();
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [completedSessionsModalVisible, setCompletedSessionsModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [allClassesModalVisible, setAllClassesModalVisible] = useState(false);
  const [upcomingClassesModalVisible, setUpcomingClassesModalVisible] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [countdownKey, setCountdownKey] = useState(0);
  const firstName = profile?.fullName?.split(' ')[0] || 'Student';

  // Fetch upcoming classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const studentProgram = profile?.program || '24-session';
      console.log('Student program:', studentProgram);
      console.log('Fetching classes for program:', studentProgram);

      const [upcomingRes, activeRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/upcoming/${studentProgram}`),
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/active/${studentProgram}`)
      ]);

      console.log('Upcoming classes response:', upcomingRes.data);
      console.log('Active class response:', activeRes.data);

      setUpcomingClasses(upcomingRes.data);
      setActiveClass(activeRes.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      message.error('Failed to fetch class schedule');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student attendance with better error handling
  const fetchStudentAttendance = async () => {
    try {
      if (!profile?._id) return;

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/attendance/student/${profile._id}`);
      setStudentAttendance(response.data);
      
      // Log attendance data for debugging
      console.log('Student attendance data:', response.data);
    } catch (err) {
      console.error('Error fetching student attendance:', err);
      message.error('Failed to load attendance data. Please try refreshing the page.');
    }
  };

  // Refresh attendance data
  const refreshAttendance = async () => {
    try {
      message.loading('Refreshing attendance data...', 1);
      await fetchStudentAttendance();
      message.success('Attendance data refreshed successfully');
    } catch (err) {
      console.error('Error refreshing attendance:', err);
      message.error('Failed to refresh attendance data');
    }
  };

  // Fetch completed sessions
  const fetchCompletedSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/completed-sessions`);
      setCompletedSessions(response.data.sessions || []);
    } catch (err) {
      console.error('Error fetching completed sessions:', err);
    }
  };

  // Fetch all classes for calendar
  const fetchAllClasses = async () => {
    try {
      const studentProgram = profile?.program || '24-session';
      const [upcomingRes, completedRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/upcoming/${studentProgram}`),
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/classes/completed-sessions`)
      ]);

      const allClassesData = [
        ...upcomingRes.data,
        ...completedRes.data.sessions
      ];

      setAllClasses(allClassesData);
    } catch (err) {
      console.error('Error fetching all classes:', err);
    }
  };

  // Handle browser crash recovery and session restoration
  useEffect(() => {
    const checkForActiveSessions = async () => {
      try {
        const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
        
        if (joinedClasses.length > 0) {
          // Check if any of these classes are still ongoing
          const ongoingClasses = allClasses.filter(cls => 
            cls.status === 'ongoing' && joinedClasses.includes(cls._id)
          );

          if (ongoingClasses.length > 0) {
            message.info('Detected active class session. Attempting to restore connection...');
            
            // For each ongoing class, try to reconnect
            for (const classData of ongoingClasses) {
              try {
                await handleReconnect(classData);
              } catch (err) {
                console.error(`Failed to reconnect to class ${classData.title}:`, err);
              }
            }
          } else {
            // Clear localStorage if no ongoing classes
            localStorage.removeItem('joinedClasses');
          }
        }
      } catch (err) {
        console.error('Error checking for active sessions:', err);
      }
    };

    // Check for active sessions when component mounts
    if (allClasses.length > 0) {
      checkForActiveSessions();
    }
  }, [allClasses]);

  // Handle page visibility change (when user switches tabs or browser crashes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible again, check if we need to reconnect
        const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
        const ongoingClasses = allClasses.filter(cls => 
          cls.status === 'ongoing' && joinedClasses.includes(cls._id)
        );

        if (ongoingClasses.length > 0) {
          message.info('Page restored. Checking class connections...');
          // You can add additional reconnection logic here if needed
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [allClasses]);

  // Socket.io real-time class updates
  useEffect(() => {
    if (socket && profile?.program) {
      // Listen for class status changes
      socket.on('class-status-changed', (data) => {
        console.log('Received class status change:', data);
        
        // Update active class if it's the same class
        if (activeClass && activeClass._id === data.classId) {
          if (data.status === 'completed') {
            setActiveClass(null);
            message.info('Class has ended');
          } else {
            setActiveClass(prev => ({ ...prev, status: data.status, ...data.updates }));
          }
        }
        
        // Refresh classes data
        fetchClasses();
        fetchAllClasses();
      });

      // Listen for new class scheduled
      socket.on('new-class-scheduled', (data) => {
        console.log('New class scheduled:', data);
        if (data.program === profile.program) {
          message.info(`New class scheduled: ${data.title}`);
          fetchClasses();
          fetchAllClasses();
        }
      });

      // Listen for class updates
      socket.on('class-updated', (data) => {
        console.log('Class updated:', data);
        if (data.program === profile.program) {
          message.info(`Class updated: ${data.title}`);
          fetchClasses();
          fetchAllClasses();
        }
      });

      // Cleanup listeners
      return () => {
        socket.off('class-status-changed');
        socket.off('new-class-scheduled');
        socket.off('class-updated');
      };
    }
  }, [socket, profile?.program, activeClass]);

  useEffect(() => {
    if (profile?.program) {
      fetchClasses();
      fetchStudentAttendance();
      fetchCompletedSessions();
      fetchAllClasses();
    }
  }, [profile?.program]);

  // Countdown timer effect
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdownKey(prev => prev + 1);
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Function to format time until class starts
  const getTimeUntilClass = (startTime) => {
    const now = moment();
    const start = moment(startTime);
    const duration = moment.duration(start.diff(now));

    if (duration.asSeconds() <= 0) {
      return 'Starting now';
    }

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (days > 0) {
      return `${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else {
      return `${seconds.toString().padStart(2, '0')}s`;
    }
  };

  // Function to check if a class is about to start (within next 30 minutes)
  const isClassStartingSoon = (startTime) => {
    const now = moment();
    const start = moment(startTime);
    const minutesUntilStart = start.diff(now, 'minutes');
    return minutesUntilStart <= 30 && minutesUntilStart > 0;
  };

  // Handle join class
  const handleJoinClass = async (classData) => {
    try {
      // Check if we already joined this class (stored in localStorage)
      const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
      const isReconnect = joinedClasses.includes(classData._id);
      
      // Record join time or handle reconnection
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/attendance/join`, {
        classId: classData._id,
        studentId: profile._id,
        isReconnect
      });

      // Store class ID in localStorage to track joined classes
      if (!joinedClasses.includes(classData._id)) {
        joinedClasses.push(classData._id);
        localStorage.setItem('joinedClasses', JSON.stringify(joinedClasses));
      }

      setIsJoined(true);
      
      if (isReconnect) {
        message.success('Reconnected to class successfully');
      } else {
        message.success('Join time recorded successfully');
      }

      // Open meeting in new tab with optimized Jitsi settings
      const optimizedMeetingLink = `${classData.meetingLink}#config.prejoinPageEnabled=false&config.disableAudioLevels=true&config.maxFullResolutionParticipants=4&config.maxThumbnailResolution=180&config.resolution=720&config.constraints.video.width.ideal=1280&config.constraints.video.height.ideal=720&config.constraints.video.frameRate.ideal=15&config.constraints.video.frameRate.max=30&config.p2p.enabled=false&config.websocket=wss://meet.jit.si/xmpp-websocket&config.websocketKeepAlive=30&config.websocketKeepAliveUrl=https://meet.jit.si/ping&config.websocketKeepAliveInterval=30`;
      
      const meetingWindow = window.open(optimizedMeetingLink, '_blank');

      // Set up leave tracking when user closes tab
      window.addEventListener('beforeunload', () => {
        handleLeaveClass(classData);
      });

      // Handle meeting window close
      if (meetingWindow) {
        const checkWindowClosed = setInterval(() => {
          if (meetingWindow.closed) {
            clearInterval(checkWindowClosed);
            handleLeaveClass(classData);
          }
        }, 1000);
      }

    } catch (err) {
      console.error('Error joining class:', err);
      
      // If it's a network error or browser crash, try reconnection
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        message.warning('Connection lost. Attempting to reconnect...');
        
        // Try reconnection after 3 seconds
        setTimeout(async () => {
          try {
            await handleReconnect(classData);
          } catch (reconnectErr) {
            console.error('Reconnection failed:', reconnectErr);
            message.error('Failed to reconnect. Please refresh the page.');
          }
        }, 3000);
      } else {
        message.error('Failed to record join time');
      }
    }
  };

  // Handle reconnection
  const handleReconnect = async (classData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/attendance/reconnect`, {
        classId: classData._id,
        studentId: profile._id
      });

      setIsJoined(true);
      message.success('Reconnected successfully');

      // Open meeting in new tab with optimized Jitsi settings
      const optimizedMeetingLink = `${classData.meetingLink}#config.prejoinPageEnabled=false&config.disableAudioLevels=true&config.maxFullResolutionParticipants=4&config.maxThumbnailResolution=180&config.resolution=720&config.constraints.video.width.ideal=1280&config.constraints.video.height.ideal=720&config.constraints.video.frameRate.ideal=15&config.constraints.video.frameRate.max=30&config.p2p.enabled=false&config.websocket=wss://meet.jit.si/xmpp-websocket&config.websocketKeepAlive=30&config.websocketKeepAliveUrl=https://meet.jit.si/ping&config.websocketKeepAliveInterval=30`;
      
      window.open(optimizedMeetingLink, '_blank');

    } catch (err) {
      console.error('Error reconnecting:', err);
      throw err;
    }
  };

  // Handle leave class
  const handleLeaveClass = async (classData) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/attendance/leave`, {
        classId: classData._id,
        studentId: profile._id
      });

      // Remove class ID from localStorage
      const joinedClasses = JSON.parse(localStorage.getItem('joinedClasses') || '[]');
      const updatedClasses = joinedClasses.filter(id => id !== classData._id);
      localStorage.setItem('joinedClasses', JSON.stringify(updatedClasses));

      setIsJoined(false);
      message.info('Leave time recorded');
    } catch (err) {
      console.error('Error leaving class:', err);
    }
  };

  const classColumns = [
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
      render: (duration) => `${duration} minutes`,
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
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      <div style={{ padding: '24px 40px' }}>
        <Title level={2}>Welcome, {firstName}</Title>
        <Text>Enrolled in: {profile?.program || '24-session'} Program</Text>

        <div style={{ marginTop: 20 }}>
          <Progress
            percent={studentAttendance?.stats?.attendancePercentage || 0}
            showInfo={false}
            status={studentAttendance?.stats?.attendancePercentage >= 80 ? 'success' : 'active'}
          />
          <Text>
            {studentAttendance?.stats?.present || 0} of {studentAttendance?.stats?.totalClasses || 0} sessions attended
          </Text>
        </div>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {/* Left Side */}
          <Col xs={24} lg={12}>
            <Row gutter={[0, 24]}>
              {/* Live Class Card */}
              <Col xs={24}>
                <Card title="LIVE CLASS" loading={loading}>
                  {activeClass ? (
                    <div>
                      <Row justify="space-between" align="middle">
                        <Col span={16}>
                          <Text strong style={{ fontSize: '16px' }}>{activeClass.title}</Text>
                          <br />
                          <Text type="secondary">
                            {moment(activeClass.startTime).format('MMM DD, YYYY • h:mm A')} • {activeClass.duration} minutes
                          </Text>
                          <br />
                          <Text type="success">Class is in progress!</Text>
                          {activeClass.remainingTime > 0 && (
                            <Text type="warning" style={{ display: 'block', marginTop: '4px' }}>
                              {activeClass.remainingTime} minutes remaining
                            </Text>
                          )}
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                          <Space direction="vertical" size="small">
                            <Button
                              type="link"
                              icon={<InfoCircleOutlined />}
                              onClick={() => setUpcomingClassesModalVisible(true)}
                            >
                              View Details
                            </Button>
                            <Button
                              type="primary"
                              icon={<VideoCameraOutlined />}
                              onClick={() => handleJoinClass(activeClass)}
                              disabled={isJoined}
                            >
                              {isJoined ? 'Already Joined' : 'Join Now'}
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  ) : upcomingClasses[0] ? (
                    <div>
                      <Row justify="space-between" align="middle">
                        <Col span={16}>
                          <Text strong style={{ fontSize: '16px' }}>{upcomingClasses[0].title}</Text>
                          <br />
                          <Text type="secondary">
                            {moment(upcomingClasses[0].startTime).format('MMM DD, YYYY • h:mm A')} • {upcomingClasses[0].duration} minutes
                          </Text>
                          <br />
                          <Text key={countdownKey}>
                            Starts in {getTimeUntilClass(upcomingClasses[0].startTime)}
                          </Text>
                        </Col>
                        <Col span={8} style={{ textAlign: 'right' }}>
                          <Space direction="vertical" size="small">
                            <Button
                              type="link"
                              icon={<InfoCircleOutlined />}
                              onClick={() => setUpcomingClassesModalVisible(true)}
                            >
                              View Details
                            </Button>
                            <Button
                              type="default"
                              disabled={!isClassStartingSoon(upcomingClasses[0].startTime)}
                            >
                              {isClassStartingSoon(upcomingClasses[0].startTime) ? 'Waiting to Start' : 'Not Started Yet'}
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  ) : (
                    <Empty description="No upcoming classes scheduled" />
                  )}
                </Card>
              </Col>

              {/* My Attendance Card */}
              <Col xs={24}>
                <Card
                  title="MY ATTENDANCE"
                  extra={
                    <Space>
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={refreshAttendance}
                        size="small"
                      >
                        Refresh
                      </Button>
                      <Button
                        type="link"
                        icon={<LineChartOutlined />}
                        onClick={() => setAttendanceModalVisible(true)}
                      >
                        View Details
                      </Button>
                    </Space>
                  }
                >
                  {studentAttendance ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <div style={{ textAlign: 'center' }}>
                            <Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
                              {studentAttendance.stats.present}
                            </Text>
                            <br />
                            <Text type="secondary">Present</Text>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ textAlign: 'center' }}>
                            <Text strong style={{ fontSize: '24px', color: '#faad14' }}>
                              {studentAttendance.stats.partial}
                            </Text>
                            <br />
                            <Text type="secondary">Partial</Text>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ textAlign: 'center' }}>
                            <Text strong style={{ fontSize: '24px', color: '#ff4d4f' }}>
                              {studentAttendance.stats.absent}
                            </Text>
                            <br />
                            <Text type="secondary">Absent</Text>
                          </div>
                        </Col>
                      </Row>
                      <Divider />
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Text>
                            Attendance Rate: <Text strong>{studentAttendance.stats.attendancePercentage}%</Text>
                          </Text>
                        </Col>
                        <Col>
                          <Text type="secondary">
                            Total Classes: {studentAttendance.stats.totalClasses}
                          </Text>
                        </Col>
                      </Row>
                    </Space>
                  ) : (
                    <Empty description="No attendance data available" />
                  )}
                </Card>
              </Col>
              {/* Study Materials Card */}
              <Col xs={24}>
                <Card title="STUDY MATERIALS">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<FilePdfOutlined />} block style={{ textAlign: 'left' }}>
                      PDF documents
                    </Button>
                    <Button icon={<VideoCameraOutlined />} block style={{ textAlign: 'left' }}>
                      Video lessons
                    </Button>
                    <Button icon={<AudioOutlined />} block style={{ textAlign: 'left' }}>
                      Audio files
                    </Button>
                  </Space>
                </Card>
              </Col>
              {/* Certificates Card */}
              <Col xs={24}>
                <Card title="CERTIFICATES / ACHIEVEMENTS">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<TrophyOutlined />} block style={{ textAlign: 'left' }}>
                      View certificates
                    </Button>
                    <Button icon={<LineChartOutlined />} block style={{ textAlign: 'left' }}>
                      Track progress
                    </Button>
                  </Space>
                </Card>
              </Col>

            </Row>
          </Col>

          {/* Right Side */}
          <Col xs={24} lg={12}>
            <Row gutter={[0, 24]}>
              <Col xs={24}>
                <Card
                  title="CLASS SCHEDULE"
                  extra={
                    <Button
                      type="link"
                      icon={<CalendarOutlined />}
                      onClick={() => setAllClassesModalVisible(true)}
                    >
                      View All
                    </Button>
                  }
                >
                  <CustomCalendar classes={allClasses} />
                </Card>
              </Col>
              {/* Quizzes Card */}
              <Col xs={24}>
                <Card title="QUIZZES / ASSIGNMENTS">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<QuestionCircleOutlined />} block style={{ textAlign: 'left' }}>
                      Take quizzes
                    </Button>
                    <Button block style={{ textAlign: 'left' }}>
                      Submit assignments
                    </Button>
                  </Space>
                </Card>
              </Col>
              {/* Support Card */}
              <Col xs={24}>
                <Card title="SUPPORT">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<QuestionCircleOutlined />} block style={{ textAlign: 'left' }}>
                      Help Center
                    </Button>
                    <Button icon={<MailOutlined />} block style={{ textAlign: 'left' }}>
                      Contact us
                    </Button>
                  </Space>
                </Card>
              </Col>

            </Row>
          </Col>

          {/* Completed Sessions Card */}
          {/* <Col xs={24} md={12}>
            <Card 
              title="COMPLETED SESSIONS" 
              extra={
                <Button 
                  type="link" 
                  icon={<CalendarOutlined />}
                  onClick={() => setCompletedSessionsModalVisible(true)}
                >
                  View All
                </Button>
              }
            >
              {completedSessions.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {completedSessions.slice(0, 3).map((session) => (
                    <div key={session._id} style={{ 
                      padding: '12px', 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '6px',
                      backgroundColor: '#fafafa'
                    }}>
                      <Text strong>{session.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {moment(session.startTime).format('MMM DD, YYYY')} • {session.duration} minutes
                      </Text>
                    </div>
                  ))}
                  {completedSessions.length > 3 && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      +{completedSessions.length - 3} more sessions
                    </Text>
                  )}
                </Space>
              ) : (
                <Empty description="No completed sessions yet" />
              )}
            </Card>
          </Col> */}
        </Row>

        {/* Completed Sessions Modal */}
        <Modal
          title={
            <Space>
              <CalendarOutlined />
              <span>All Completed Sessions</span>
            </Space>
          }
          open={completedSessionsModalVisible}
          onCancel={() => setCompletedSessionsModalVisible(false)}
          footer={null}
          width={800}
        >
          {completedSessions.length > 0 ? (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {completedSessions.map((session) => (
                  <div key={session._id} style={{
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    marginBottom: '12px'
                  }}>
                    <Row justify="space-between" align="middle">
                      <Col span={16}>
                        <Text strong style={{ fontSize: '16px' }}>{session.title}</Text>
                        <br />
                        <Text type="secondary">
                          {moment(session.startTime).format('MMMM DD, YYYY')} at {moment(session.startTime).format('h:mm A')}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Duration: {session.duration} minutes
                        </Text>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <Tag color="green">Completed</Tag>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Space>
            </div>
          ) : (
            <Empty description="No completed sessions available" />
          )}
        </Modal>

        {/* Attendance Details Modal */}
        <Modal
          title={
            <Space>
              <LineChartOutlined />
              <span>My Attendance Details</span>
            </Space>
          }
          open={attendanceModalVisible}
          onCancel={() => setAttendanceModalVisible(false)}
          footer={null}
          width={900}
        >
          {studentAttendance?.history?.length > 0 ? (
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {studentAttendance.history.map((record) => (
                  <div key={record._id} style={{
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    marginBottom: '12px'
                  }}>
                    <Row justify="space-between" align="middle">
                      <Col span={16}>
                        <Text strong style={{ fontSize: '16px' }}>
                          {record.classId?.title || 'Unknown Class'}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {moment(record.classId?.startTime).format('MMMM DD, YYYY')} at {moment(record.classId?.startTime).format('h:mm A')}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Class Duration: {record.classId?.duration || 0} minutes
                        </Text>
                        <br />
                        <Text type="secondary">
                          Your Duration: {record.duration || 0} minutes
                        </Text>
                        {record.joinTime && (
                          <>
                            <br />
                            <Text type="secondary">
                              Joined: {moment(record.joinTime).format('h:mm A')}
                            </Text>
                          </>
                        )}
                        {record.leaveTime && (
                          <>
                            <br />
                            <Text type="secondary">
                              Left: {moment(record.leaveTime).format('h:mm A')}
                            </Text>
                          </>
                        )}
                        {!record.joinTime && (
                          <>
                            <br />
                            <Text type="danger">
                              Did not join this class
                            </Text>
                          </>
                        )}
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {record.status === 'present' && (
                          <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            <CheckCircleOutlined /> Present
                          </Tag>
                        )}
                        {record.status === 'partial' && (
                          <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            <FieldTimeOutlined /> Partial
                          </Tag>
                        )}
                        {record.status === 'absent' && (
                          <Tag color="red" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            <CloseCircleOutlined /> Absent
                          </Tag>
                        )}
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                          {record.duration > 0 ? 
                            `${Math.round((record.duration / (record.classId?.duration || 1)) * 100)}% attended` : 
                            'No attendance'
                          }
                        </Text>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Space>
            </div>
          ) : (
            <Empty description="No attendance records available" />
          )}
        </Modal>

        {/* Upcoming Classes Modal */}
        <Modal
          title={
            <Space>
              <VideoCameraOutlined />
              <span>Upcoming Classes</span>
            </Space>
          }
          open={upcomingClassesModalVisible}
          onCancel={() => setUpcomingClassesModalVisible(false)}
          footer={null}
          width={900}
        >
          {upcomingClasses.length > 0 ? (
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {upcomingClasses.map((cls, index) => (
                  <div key={cls._id} style={{
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    marginBottom: '12px'
                  }}>
                    <Row justify="space-between" align="middle">
                      <Col span={16}>
                        <Text strong style={{ fontSize: '16px' }}>
                          #{index + 1} - {cls.title}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {moment(cls.startTime).format('MMMM DD, YYYY')} at {moment(cls.startTime).format('h:mm A')}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Duration: {cls.duration} minutes
                        </Text>
                        <br />
                        <Text type="secondary">
                          {cls.description || 'No description available'}
                        </Text>
                        <br />
                        <Text type="warning" key={`modal-${cls._id}-${countdownKey}`}>
                          Starts in {getTimeUntilClass(cls.startTime)}
                        </Text>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                          SCHEDULED
                        </Tag>
                        <br />
                        <br />
                        <Button
                          type="default"
                          disabled={!isClassStartingSoon(cls.startTime)}
                          style={{ marginTop: '8px' }}
                        >
                          {isClassStartingSoon(cls.startTime) ? 'Can Start Soon' : 'Not Ready Yet'}
                        </Button>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Space>
            </div>
          ) : (
            <Empty description="No upcoming classes scheduled" />
          )}
        </Modal>

        {/* All Classes Modal */}
        <Modal
          title={
            <Space>
              <CalendarOutlined />
              <span>All Classes</span>
            </Space>
          }
          open={allClassesModalVisible}
          onCancel={() => setAllClassesModalVisible(false)}
          footer={null}
          width={900}
        >
          {allClasses.length > 0 ? (
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {allClasses.map((cls, index) => (
                  <div key={cls._id} style={{
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    marginBottom: '12px'
                  }}>
                    <Row justify="space-between" align="middle">
                      <Col span={16}>
                        <Text strong style={{ fontSize: '16px' }}>
                          #{index + 1} - {cls.title}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {moment(cls.startTime).format('MMMM DD, YYYY')} at {moment(cls.startTime).format('h:mm A')}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Duration: {cls.duration} minutes
                        </Text>
                        <br />
                        <Text type="secondary">
                          {cls.description || 'No description available'}
                        </Text>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {cls.status === 'scheduled' && (
                          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            SCHEDULED
                          </Tag>
                        )}
                        {cls.status === 'completed' && (
                          <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            COMPLETED
                          </Tag>
                        )}
                        {cls.status === 'ongoing' && (
                          <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                            ONGOING
                          </Tag>
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
              </Space>
            </div>
          ) : (
            <Empty description="No classes available" />
          )}
        </Modal>
        
      </div>
    </div>
  );
};

export default StudentDashboard;