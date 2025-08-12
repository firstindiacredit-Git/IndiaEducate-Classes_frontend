import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Collapse,
  Space,
  Input,
  Button,
  Row,
  Col,
  Tag,
  Divider,
  Alert,
  Empty,
  Spin,
  message
} from 'antd';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  TrophyOutlined,
  UserOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../component/AuthProvider';
import StudentNavbar from './StudentNavbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from './StudentSidebar';
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

const FAQ = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [adminFAQs, setAdminFAQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Default FAQ categories and questions
  const defaultFAQs = {
    'General Questions': [
      {
        question: 'What is India Educates?',
        answer: 'India Educates is an online education platform that provides comprehensive learning programs for students. We offer live classes, assignments, quizzes, and progress tracking to help students achieve their educational goals.',
        category: 'general'
      },
      {
        question: 'How do I get started with my course?',
        answer: 'After registration, you can access your dashboard where you\'ll find your class schedule, assignments, and study materials. Make sure to complete your profile and check your class timings in your local timezone.',
        category: 'general'
      },
      {
        question: 'What programs are available?',
        answer: 'We offer various programs including 24-session courses and other specialized learning tracks. Each program includes live classes, assignments, quizzes, and certificates upon completion.',
        category: 'general'
      }
    ],
    'Classes & Attendance': [
      {
        question: 'How do I join a live class?',
        answer: 'When a class is about to start (within 30 minutes), you\'ll see a "Join Now" button on your dashboard. Click it to open the meeting link in a new tab. Make sure you have a stable internet connection.',
        category: 'classes'
      },
      {
        question: 'What if I miss a class?',
        answer: 'If you miss a class, you can check the class recordings (if available) in the File Library. However, attendance is important for your progress tracking and certificate eligibility.',
        category: 'classes'
      },
      {
        question: 'How is attendance calculated?',
        answer: 'Attendance is calculated based on your join and leave times during live classes. You need to be present for at least 70% of the class duration to be marked as present.',
        category: 'classes'
      },
      {
        question: 'What timezone are classes scheduled in?',
        answer: 'Classes are scheduled in Indian Standard Time (IST), but your dashboard will show times converted to your local timezone based on your profile settings.',
        category: 'classes'
      },
      {
        question: 'Can I join a class late?',
        answer: 'Yes, you can join a class late, but it may affect your attendance record. It\'s recommended to join at least 5 minutes before the scheduled start time.',
        category: 'classes'
      }
    ],
    'Assignments & Quizzes': [
      {
        question: 'How do I submit assignments?',
        answer: 'Go to the Assignment Dashboard from your main dashboard. You\'ll see available assignments with due dates. Click on "Submit Assignment" to upload your work in supported formats (PDF, DOC, images).',
        category: 'assignments'
      },
      {
        question: 'What file formats are accepted for assignments?',
        answer: 'We accept PDF, DOC, DOCX, JPG, PNG, and GIF files for assignments. Maximum file size is 10MB per submission.',
        category: 'assignments'
      },
      {
        question: 'How do I take quizzes?',
        answer: 'Navigate to the Quiz Dashboard from your main dashboard. You\'ll see available quizzes. Click "Take Quiz" to start. Make sure you have a stable internet connection as quizzes are timed.',
        category: 'assignments'
      },
      {
        question: 'Can I retake a quiz if I fail?',
        answer: 'Quiz retake policies vary by quiz. Check the quiz details for retake information. Some quizzes allow multiple attempts while others are one-time only.',
        category: 'assignments'
      },
      {
        question: 'How are assignments graded?',
        answer: 'Assignments are reviewed by instructors and graded based on completion, quality, and adherence to requirements. You\'ll receive feedback and scores in your Assignment History.',
        category: 'assignments'
      }
    ],
    'Study Materials & Files': [
      {
        question: 'Where can I find study materials?',
        answer: 'Access study materials through the File Library section. Materials are organized by type: PDF files, video lessons, and audio files. You can download or view them directly.',
        category: 'materials'
      },
      {
        question: 'Can I download study materials?',
        answer: 'Yes, most study materials can be downloaded for offline access. However, some materials may be view-only for copyright reasons.',
        category: 'materials'
      },
      {
        question: 'What types of study materials are available?',
        answer: 'We provide PDF documents, video lessons, audio files, and other educational resources relevant to your course content.',
        category: 'materials'
      }
    ],
    'Progress & Certificates': [
      {
        question: 'How can I track my progress?',
        answer: 'Use the Progress Tracking section to view your overall progress, completed activities, and earned badges. Your dashboard also shows a progress bar with completion percentage.',
        category: 'progress'
      },
      {
        question: 'When do I receive my certificate?',
        answer: 'Certificates are awarded upon successful completion of your program, including required attendance, assignments, and quizzes. Check the Certificate section for your earned certificates.',
        category: 'progress'
      },
      {
        question: 'What are badges and how do I earn them?',
        answer: 'Badges are achievements you earn for completing milestones, maintaining good attendance, or excelling in assignments. They appear on your dashboard and progress tracking page.',
        category: 'progress'
      },
      {
        question: 'How is my overall progress calculated?',
        answer: 'Progress is calculated based on completed classes, submitted assignments, quiz scores, and attendance. Each component has a specific weight in the final calculation.',
        category: 'progress'
      }
    ],
    'Technical Issues': [
      {
        question: 'What if I can\'t join a class due to technical issues?',
        answer: 'If you experience technical issues, try refreshing your browser, checking your internet connection, or using a different browser. If problems persist, contact support through the Help Center.',
        category: 'technical'
      },
      {
        question: 'What browser should I use?',
        answer: 'We recommend using Google Chrome, Mozilla Firefox, or Microsoft Edge for the best experience. Make sure your browser is updated to the latest version.',
        category: 'technical'
      },
      {
        question: 'What internet speed do I need?',
        answer: 'For live classes, we recommend a minimum of 2 Mbps download and 1 Mbps upload speed. For better video quality, 5 Mbps or higher is recommended.',
        category: 'technical'
      },
      {
        question: 'What if my video/audio doesn\'t work in class?',
        answer: 'Check your browser permissions for camera and microphone access. Try refreshing the page or rejoining the class. If issues persist, contact technical support.',
        category: 'technical'
      }
    ],
    'Account & Profile': [
      {
        question: 'How do I update my profile information?',
        answer: 'Go to your profile settings to update personal information, contact details, and timezone preferences. Some changes may require admin approval.',
        category: 'account'
      },
      {
        question: 'What if I forget my password?',
        answer: 'Use the "Forgot Password" option on the login page. You\'ll receive a reset link via email or SMS to create a new password.',
        category: 'account'
      },
      {
        question: 'Can I change my email address?',
        answer: 'Email address changes require admin approval. Contact support through the Help Center to request an email change.',
        category: 'account'
      },
      {
        question: 'How do I log out?',
        answer: 'Click on your profile menu in the top right corner and select "Logout" to safely exit your account.',
        category: 'account'
      }
    ],
    'Support & Contact': [
      {
        question: 'How do I get help if I have an issue?',
        answer: 'You can get help through multiple channels: Help Center (raise a ticket), Contact Us form, phone support, or email. For urgent issues during class hours, call our support line.',
        category: 'support'
      },
      {
        question: 'What information should I include when contacting support?',
        answer: 'Include your name, student ID, detailed description of the issue, screenshots if applicable, and steps to reproduce the problem. This helps us resolve issues faster.',
        category: 'support'
      },
      {
        question: 'What are the support hours?',
        answer: 'Support is available Monday-Thursday 8:00 AM - 1:00 PM, Friday-Saturday 8:00 AM - 12:00 PM IST. For urgent issues, you can call our support line.',
        category: 'support'
      },
      {
        question: 'How long does it take to get a response?',
        answer: 'We typically respond within 24-48 hours during business days. Urgent technical issues during class hours are prioritized.',
        category: 'support'
      }
    ]
  };

  // Fetch admin-added FAQs
  const fetchAdminFAQs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/faq/admin-faqs`);
      setAdminFAQs(response.data.faqs || []);
    } catch (err) {
      console.error('Error fetching admin FAQs:', err);
      // Don't show error message as admin FAQs are optional
    } finally {
      setLoading(false);
    }
  };

  // Mark FAQ as helpful
  const markAsHelpful = async (faqId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/faq/${faqId}/helpful`, {}, {
        headers: {
          'student-email': localStorage.getItem('studentEmailOrPhone'),
          'student-phone': localStorage.getItem('studentEmailOrPhone')
        }
      });
      message.success('Thank you for your feedback!');
    } catch (err) {
      console.error('Error marking FAQ as helpful:', err);
      message.error('Failed to mark as helpful');
    }
  };

  useEffect(() => {
    fetchAdminFAQs();
  }, []);

  // Filter FAQs based on search text
  const filterFAQs = (faqs) => {
    if (!searchText) return faqs;
    
    return Object.keys(faqs).reduce((filtered, category) => {
      const filteredQuestions = faqs[category].filter(item =>
        item.question.toLowerCase().includes(searchText.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchText.toLowerCase())
      );
      
      if (filteredQuestions.length > 0) {
        filtered[category] = filteredQuestions;
      }
      
      return filtered;
    }, {});
  };

  // Filter admin FAQs
  const filteredAdminFAQs = adminFAQs.filter(faq =>
    !searchText || 
    faq.question.toLowerCase().includes(searchText.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredDefaultFAQs = filterFAQs(defaultFAQs);

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'general': return <QuestionCircleOutlined />;
      case 'classes': return <VideoCameraOutlined />;
      case 'assignments': return <FileTextOutlined />;
      case 'materials': return <BookOutlined />;
      case 'progress': return <TrophyOutlined />;
      case 'technical': return <SettingOutlined />;
      case 'account': return <UserOutlined />;
      case 'support': return <QuestionCircleOutlined />;
      default: return <QuestionCircleOutlined />;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'general': return 'blue';
      case 'classes': return 'green';
      case 'assignments': return 'orange';
      case 'materials': return 'purple';
      case 'progress': return 'gold';
      case 'technical': return 'red';
      case 'account': return 'cyan';
      case 'support': return 'magenta';
      default: return 'default';
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
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
            <Title level={2} style={{ margin: 0 }}>
              <QuestionCircleOutlined style={{ marginRight: '8px' }} />
              Frequently Asked Questions
            </Title>
          </Space>
        </Row>

        {/* Search Bar */}
        <Card style={{ marginBottom: 24 }}>
          <Search
            placeholder="Search for questions or answers..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 600 }}
          />
        </Card>

        {/* Admin FAQs Section */}
        {filteredAdminFAQs.length > 0 && (
          <Card 
            title={
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                <span>Important Updates & Announcements</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
            extra={
              <Tag color="gold" icon={<StarOutlined />}>
                Admin Added
              </Tag>
            }
          >
            <Alert
              message="Latest Information"
              description="These FAQs are added by administrators and contain the most up-to-date information about our platform."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Collapse 
              activeKey={activeKey}
              onChange={setActiveKey}
              expandIconPosition="end"
            >
              {filteredAdminFAQs.map((faq, index) => (
                <Panel
                  key={`admin-${index}`}
                  header={
                    <Space>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <Text strong>{faq.question}</Text>
                    </Space>
                  }
                >
                                     <Paragraph style={{ marginBottom: 0 }}>
                     {faq.answer}
                   </Paragraph>
                   <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     {faq.category && (
                       <Tag color={getCategoryColor(faq.category)} icon={getCategoryIcon(faq.category)}>
                         {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                       </Tag>
                     )}
                     <Button
                       type="link"
                       size="small"
                       icon={<StarOutlined />}
                       onClick={() => markAsHelpful(faq._id)}
                     >
                       Helpful ({faq.helpfulCount || 0})
                     </Button>
                   </div>
                </Panel>
              ))}
            </Collapse>
          </Card>
        )}

        {/* Default FAQs */}
        {Object.keys(filteredDefaultFAQs).length > 0 ? (
          <Row gutter={[24, 24]}>
            {Object.entries(filteredDefaultFAQs).map(([category, questions]) => (
              <Col xs={24} lg={12} key={category}>
                <Card
                  title={
                    <Space>
                      {getCategoryIcon(questions[0]?.category)}
                      <span>{category}</span>
                      <Tag color={getCategoryColor(questions[0]?.category)}>
                        {questions.length} Q&A
                      </Tag>
                    </Space>
                  }
                  style={{ height: '100%' }}
                >
                  <Collapse 
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    expandIconPosition="end"
                    size="small"
                  >
                    {questions.map((faq, index) => (
                      <Panel
                        key={`${category}-${index}`}
                        header={
                          <Text style={{ fontSize: '14px' }}>
                            {faq.question}
                          </Text>
                        }
                      >
                        <Paragraph style={{ marginBottom: 0, fontSize: '13px' }}>
                          {faq.answer}
                        </Paragraph>
                      </Panel>
                    ))}
                  </Collapse>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card>
            <Empty
              description={
                <div>
                  <Text>No FAQs found matching your search.</Text>
                  <br />
                  <Text type="secondary">Try different keywords or browse all categories.</Text>
                </div>
              }
            />
          </Card>
        )}

        {/* Quick Actions */}
        <Card title="Need More Help?" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Button
                type="primary"
                icon={<QuestionCircleOutlined />}
                onClick={() => navigate('/help-center')}
                block
              >
                Raise Support Ticket
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button
                icon={<ClockCircleOutlined />}
                onClick={() => navigate('/contact-us')}
                block
              >
                Contact Support
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => navigate('/student-dashboard')}
                block
              >
                Back to Dashboard
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;
