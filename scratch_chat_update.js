const fs = require('fs');
let code = fs.readFileSync('c:/Users/laxma/hms/frontend/src/components/consultation/ChatRoomModal.jsx', 'utf8');

// 1. Add onRequestPrescription to props
code = code.replace(
  'const ChatRoomModal = ({ isOpen, onClose, consultationData, onSessionEnd }) => {',
  'const ChatRoomModal = ({ isOpen, onClose, consultationData, onSessionEnd, onRequestPrescription }) => {'
);

// 2. Listen to end_call
code = code.replace(
  'const initChatSession = async () => {',
  `// Socket listeners for call ending
    const s = getSocket();
    const handleEndCallEvent = (data) => {
      const apptId = consultationData.appointmentId || consultationData._id;
      const incomingApptId = data?.appointment?._id || data?.appointment;
      if (apptId && incomingApptId && apptId.toString() === incomingApptId.toString()) {
        addToast('info', 'Chat session was closed by the host.');
        setIsClosed(true);
        onClose();
      }
    };
    if (s) {
      s.on('end_call', handleEndCallEvent);
    }
    
    const initChatSession = async () => {`
);

// Add cleanup for socket
code = code.replace(
  'return () => {\n      isMounted = false;\n      if (session) {\n        leaveSession(session._id);\n      }\n    };\n  }, [isOpen, consultationData]);',
  `return () => {
      isMounted = false;
      if (session) {
        leaveSession(session._id);
      }
      if (s) {
        s.off('end_call', handleEndCallEvent);
      }
    };
  }, [isOpen, consultationData]);`
);


// 3. Update handleEndSession
code = code.replace(
  'const handleEndSession = async () => {\n    try {\n      if (!session) return;\n      await api.patch(`/api/v1/chat-consultations/session/${session._id}/close`);\n      \n      // Complete Appointment\n      if (consultationData.appointmentId || consultationData._id) {\n        await api.patch(`/api/v1/appointments/${consultationData.appointmentId || consultationData._id}/status`, {\n          status: \'completed\'\n        }).catch(() => {});\n      }\n\n      setIsClosed(true);\n      addToast(\'success\', \'Chat session successfully completed and closed\');\n      if (onSessionEnd) onSessionEnd();\n      onClose();\n    } catch (err) {\n      addToast(\'error\', \'Failed to close session\');\n    }\n  };',
  `const handleEndSession = async () => {
    try {
      if (!session) return;
      await api.patch(\`/api/v1/chat-consultations/session/\${session._id}/close\`);
      
      // Emit end_call so the other participant's modal closes
      try {
        const s = getSocket();
        if (s) {
          s.emit('end_call', {
            appointment: consultationData
          });
        }
      } catch (err) { console.error(err); }

      // Complete Appointment
      if (consultationData.appointmentId || consultationData._id) {
        await api.patch(\`/api/v1/appointments/\${consultationData.appointmentId || consultationData._id}/status\`, {
          status: 'completed'
        }).catch(() => {});
      }

      setIsClosed(true);
      addToast('success', 'Chat session successfully completed and closed');
      if (onSessionEnd) onSessionEnd();
      onClose();
    } catch (err) {
      addToast('error', 'Failed to close session');
    }
  };

  const handleEndAndPrescribe = () => {
    handleEndSession().then(() => {
      if (onRequestPrescription) {
        onRequestPrescription(consultationData);
      }
    });
  };`
);

// 4. Update Header Buttons
const headerRegex = /\{!isClosed && \(\s*<Button\s*size="sm"\s*variant="outline"\s*onClick=\{handleEndSession\}\s*className="text-xs bg-red-500\/10 text-red-400 border-red-500\/20 hover:bg-red-500 hover:text-white"\s*>\s*End Session\s*<\/Button>\s*\)\}/;

code = code.replace(headerRegex, `{!isClosed && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEndSession}
                  className="text-xs bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white"
                >
                  End Chat
                </Button>
                {isDoctor && (
                  <Button
                    size="sm"
                    onClick={handleEndAndPrescribe}
                    className="text-xs bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600 hover:text-white flex items-center gap-1"
                  >
                    <FileText size={14} /> End & Prescribe
                  </Button>
                )}
              </>
            )}`);

fs.writeFileSync('c:/Users/laxma/hms/frontend/src/components/consultation/ChatRoomModal.jsx', code);
console.log('ChatRoomModal updated.');
