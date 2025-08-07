import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Card, 
  Button, 
  Space, 
  message,
  Alert,
  Row,
  Col,
  Statistic,
  Progress,
  Divider,
  Upload,
  Modal
} from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  StopOutlined,
  UploadOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;

const SubmitAssignment = () => {
  const { assignmentId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  const mediaRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Fetch assignment details
  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/${assignmentId}/start`, {
        params: { studentEmailOrPhone: emailOrPhone }
      });
      setAssignment(response.data);
      setTimeLeft(response.data.duration * 60); // Convert to seconds
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load assignment');
      navigate('/assignment-dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimerInterval(timer);
      return () => clearInterval(timer);
    }
  }, [timeLeft, showResult]);

  // Recording timer
  useEffect(() => {
    if (recording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [recording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const constraints = {
        audio: assignment.type === 'audio' || assignment.type === 'video',
        video: assignment.type === 'video'
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      const recorder = new MediaRecorder(mediaStream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: assignment.type === 'audio' ? 'audio/webm' : 'video/webm' 
        });
        setRecordedBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setRecordingTime(0);

      // Set video element source if video recording
      if (assignment.type === 'video' && mediaRef.current) {
        mediaRef.current.srcObject = mediaStream;
      }

      message.success('Recording started');
    } catch (err) {
      message.error('Failed to start recording. Please check your microphone/camera permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      message.success('Recording stopped');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };

  const handleUploadFile = async () => {
    if (!recordedBlob) {
      message.error('Please record your assignment first');
      return;
    }

    try {
      setSubmitting(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      
      // Create file from blob
      const file = new File([recordedBlob], `recording.${assignment.type === 'audio' ? 'webm' : 'webm'}`, {
        type: assignment.type === 'audio' ? 'audio/webm' : 'video/webm'
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentEmailOrPhone', emailOrPhone);
      formData.append('submissionId', assignment.submissionId);

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/student/assignments/${assignmentId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadedFile(response.data.submission);
      message.success('File uploaded successfully');
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!uploadedFile) {
      message.error('Please upload your recording first');
      return;
    }

    try {
      setSubmitting(true);
      const emailOrPhone = localStorage.getItem('studentEmailOrPhone');
      
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/student/assignments/${assignmentId}/submit`, {
        studentEmailOrPhone: emailOrPhone,
        submissionText: 'Audio/Video recording submitted',
        duration: recordingTime,
        submissionId: assignment.submissionId
      });

      setResult(response.data);
      setShowResult(true);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setUploadedFile(null);
    if (mediaRef.current) {
      mediaRef.current.srcObject = null;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <Text>Loading assignment...</Text>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <StudentNavbar />
        <div style={{ maxWidth: 800, margin: '50px auto', padding: '0 24px' }}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={2}>Assignment Submitted Successfully!</Title>
              <Text type="secondary">
                Your {assignment.type} recording has been submitted and is under review.
              </Text>
              <div style={{ marginTop: '24px' }}>
                <Space>
                  <Button type="primary" onClick={() => navigate('/assignment-dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => navigate('/assignment-history')}>
                    View History
                  </Button>
                </Space>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <StudentNavbar />
      
      <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 24px' }}>
        {/* Assignment Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>{assignment.title}</Title>
              <Text type="secondary">{assignment.description}</Text>
            </Col>
            <Col>
              <Space direction="vertical" align="end">
                <Alert
                  message={`Time remaining: ${formatTime(timeLeft)}`}
                  type={timeLeft < 300 ? 'warning' : 'info'}
                  icon={<ClockCircleOutlined />}
                  showIcon
                />
                <Progress 
                  percent={((assignment.duration * 60 - timeLeft) / (assignment.duration * 60)) * 100}
                  size="small"
                  status={timeLeft < 300 ? 'exception' : 'active'}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Assignment Details */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Duration"
                value={assignment.duration}
                suffix="min"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Type"
                value={assignment.type.toUpperCase()}
                prefix={assignment.type === 'audio' ? <AudioOutlined /> : <VideoCameraOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Marks"
                value={assignment.totalMarks}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Passing Marks"
                value={assignment.passingMarks}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Paragraph to Read */}
        <Card title="Paragraph to Read" style={{ marginBottom: 24 }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '8px',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            {assignment.paragraph}
          </div>
          {assignment.instructions && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>Instructions:</Text>
              <div style={{ marginTop: '8px', color: '#666' }}>
                {assignment.instructions}
              </div>
            </div>
          )}
        </Card>

        {/* Recording Section */}
        <Card title={`Record Your ${assignment.type === 'audio' ? 'Audio' : 'Video'}`}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                {assignment.type === 'video' && (
                  <video
                    ref={mediaRef}
                    autoPlay
                    muted
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px'
                    }}
                  />
                )}
                
                <div style={{ marginTop: '16px' }}>
                  <Space>
                    {!recording ? (
                      <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />}
                        onClick={startRecording}
                        disabled={timeLeft === 0}
                      >
                        Start Recording
                      </Button>
                    ) : (
                      <Button 
                        danger 
                        icon={<StopOutlined />}
                        onClick={stopRecording}
                      >
                        Stop Recording
                      </Button>
                    )}
                    
                    {recordedBlob && (
                      <Button onClick={resetRecording}>
                        Reset
                      </Button>
                    )}
                  </Space>
                </div>

                {recording && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      Recording: {formatTime(recordingTime)}
                    </Text>
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div>
                <Text strong>Recording Status:</Text>
                <div style={{ marginTop: '8px' }}>
                  {!recordedBlob ? (
                    <Alert 
                      message="No recording yet" 
                      type="info" 
                      showIcon 
                    />
                  ) : (
                    <Alert 
                      message="Recording completed" 
                      type="success" 
                      showIcon 
                    />
                  )}
                </div>

                {recordedBlob && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong>Recording Details:</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Text>Duration: {formatTime(recordingTime)}</Text>
                      <br />
                      <Text>Size: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB</Text>
                    </div>
                  </div>
                )}

                {recordedBlob && !uploadedFile && (
                  <div style={{ marginTop: '16px' }}>
                    <Button 
                      type="primary" 
                      icon={<UploadOutlined />}
                      onClick={handleUploadFile}
                      loading={submitting}
                      block
                    >
                      Upload Recording
                    </Button>
                  </div>
                )}

                {uploadedFile && (
                  <div style={{ marginTop: '16px' }}>
                    <Alert 
                      message="File uploaded successfully" 
                      type="success" 
                      showIcon 
                    />
                    <div style={{ marginTop: '16px' }}>
                      <Button 
                        type="primary" 
                        onClick={handleSubmitAssignment}
                        loading={submitting}
                        block
                      >
                        Submit Assignment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Navigation */}
        <Card style={{ marginTop: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/assignment-dashboard')}
              >
                Back to Dashboard
              </Button>
            </Col>
            <Col>
              <Text type="secondary">
                Make sure to read the paragraph clearly and record your {assignment.type} properly.
              </Text>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default SubmitAssignment; 