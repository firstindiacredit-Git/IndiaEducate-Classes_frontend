import React, { useEffect, useState } from 'react';
import { Modal, Button, Space, message, Popconfirm } from 'antd';
import { VideoCameraOutlined, LogoutOutlined, AudioOutlined } from '@ant-design/icons';

const JitsiMeeting = ({ 
  isOpen, 
  onClose, 
  meetingLink, 
  classId, 
  isAdmin = false,
  onEndClass 
}) => {
  const [jitsiApi, setJitsiApi] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (isOpen && meetingLink) {
      loadJitsiScript();
    }
    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [isOpen, meetingLink]);

  const loadJitsiScript = () => {
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsiMeet();
      document.body.appendChild(script);
    } else {
      initJitsiMeet();
    }
  };

  const initJitsiMeet = () => {
    try {
      const domain = 'meet.jit.si';
      const roomName = meetingLink.split('/').pop();
      
      const options = {
        roomName,
        width: '100%',
        height: '600px',
        parentNode: document.getElementById('jitsi-container'),
        userInfo: {
          displayName: isAdmin ? 'Admin (Host)' : 'Student'
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'recording', 'livestreaming',
            'etherpad', 'sharedvideo', 'settings', 'raisehand', 'videoquality',
            'filmstrip', 'feedback', 'stats', 'shortcuts', 'tileview', 'select-background',
            'download', 'help', 'mute-everyone', 'security'
          ]
        }
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      setJitsiApi(api);

      // Event listeners
      api.addEventListeners({
        readyToClose: handleClose,
        participantLeft: handleParticipantLeft,
        recordingStatusChanged: handleRecordingStatusChanged
      });

    } catch (error) {
      console.error('Error initializing Jitsi meeting:', error);
      message.error('Failed to initialize meeting');
    }
  };

  const handleRecordingStatusChanged = (data) => {
    setIsRecording(data.on);
    if (data.on) {
      message.success('Recording started');
    } else {
      message.info('Recording stopped');
    }
  };

  const handleParticipantLeft = (data) => {
    if (isAdmin) {
      // If admin left, end the class
      handleEndClass();
    }
  };

  const handleClose = () => {
    if (jitsiApi) {
      jitsiApi.dispose();
    }
    onClose();
  };

  const handleEndClass = () => {
    if (isAdmin) {
      onEndClass(classId);
    }
    handleClose();
  };

  const toggleRecording = () => {
    if (jitsiApi) {
      if (!isRecording) {
        jitsiApi.executeCommand('startRecording', {
          mode: 'file'
        });
      } else {
        jitsiApi.executeCommand('stopRecording', 'file');
      }
    }
  };

  return (
    <Modal
      title={
        <Space>
          <VideoCameraOutlined />
          <span>Live Class</span>
        </Space>
      }
      open={isOpen}
      onCancel={handleClose}
      width={1200}
      footer={
        <Space>
          <Button
            icon={<AudioOutlined />}
            onClick={toggleRecording}
            type={isRecording ? 'primary' : 'default'}
            danger={isRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          {isAdmin ? (
            <Popconfirm
              title="End Class"
              description="Are you sure you want to end this class for all students?"
              onConfirm={handleEndClass}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary" danger icon={<LogoutOutlined />}>
                End Class
              </Button>
            </Popconfirm>
          ) : (
            <Button onClick={handleClose} icon={<LogoutOutlined />}>
              Leave Class
            </Button>
          )}
        </Space>
      }
      destroyOnClose
    >
      <div id="jitsi-container" />
    </Modal>
  );
};

export default JitsiMeeting; 