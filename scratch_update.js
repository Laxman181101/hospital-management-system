const fs = require('fs');
let code = fs.readFileSync('c:/Users/laxma/hms/frontend/src/components/consultation/VideoRoomModal.jsx', 'utf8');

code = code.replace(
  'const VideoRoomModal = ({ isOpen, onClose, consultationData, onConsultationComplete }) => {',
  'const VideoRoomModal = ({ isOpen, onClose, consultationData, onConsultationComplete, onRequestPrescription }) => {'
);

code = code.replace(
  'const initMeeting = async () => {',
  'useEffect(() => {\n    const s = getSocket();\n    if (s && isOpen && consultationData) {\n      const handleEndCallEvent = (data) => {\n        const apptId = consultationData.appointmentId || consultationData._id;\n        const incomingApptId = data?.appointment?._id || data?.appointment;\n        if (apptId && incomingApptId && apptId.toString() === incomingApptId.toString()) {\n          addToast(\'info\', \'Call ended by the host.\');\n          if (timerRef.current) clearInterval(timerRef.current);\n          onClose();\n        }\n      };\n      s.on(\'end_call\', handleEndCallEvent);\n      return () => {\n        s.off(\'end_call\', handleEndCallEvent);\n      };\n    }\n  }, [isOpen, consultationData, onClose, addToast]);\n\n  const initMeeting = async () => {'
);

code = code.replace(
  'const handleEndCall = () => {\n    if (timerRef.current) clearInterval(timerRef.current);\n    addToast(\'info\', \'Video room closed. You can rejoin or document consultation notes whenever ready.\');\n    onClose();\n  };',
  'const handleEndCall = () => {\n    if (timerRef.current) clearInterval(timerRef.current);\n    \n    try {\n      const s = getSocket();\n      if (s) {\n        s.emit(\'end_call\', {\n          appointment: consultationData\n        });\n      }\n    } catch (err) { console.error(err); }\n\n    addToast(\'info\', \'Video room closed.\');\n    onClose();\n  };\n\n  const handleEndAndPrescribe = () => {\n    handleEndCall();\n    if (onRequestPrescription) {\n      onRequestPrescription(consultationData);\n    }\n  };'
);

const clinicalNotesBtnRegex = /\{\s*isDoctor && \(\s*<Button\s*size="sm"\s*variant=\{showNotesPanel \? 'primary' : 'outline'\}\s*onClick=\{.*?\}\s*className=".*?"\s*>\s*<FileText size=\{14\} \/>\s*\{showNotesPanel \? 'Hide Notes' : 'Clinical Notes'\}\s*<\/Button>\s*\)\s*\}/gs;
code = code.replace(clinicalNotesBtnRegex, '');

const notesPanelRegex = /\{\/\* Doctor Clinical Notes Side-Drawer \*\/\}\s*\{showNotesPanel && isDoctor && \(.*?\}\s*\)\}/s;
code = code.replace(notesPanelRegex, '');

const leaveBtnRegex = /<Button\s*variant="danger"\s*size="sm"\s*onClick=\{handleEndCall\}\s*className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg shadow-red-900\/30"\s*>\s*<PhoneOff size=\{16\} \/>\s*<span>Leave \/ End Call<\/span>\s*<\/Button>/s;

code = code.replace(leaveBtnRegex, `<Button
              variant="danger"
              size="sm"
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg shadow-red-900/30"
            >
              <PhoneOff size={16} />
              <span>End Call</span>
            </Button>

            {isDoctor && (
              <Button
                size="sm"
                onClick={handleEndAndPrescribe}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 px-5 py-2 rounded-xl shadow-lg shadow-indigo-900/30"
              >
                <FileText size={16} />
                <span>End & Prescribe</span>
              </Button>
            )}`);

fs.writeFileSync('c:/Users/laxma/hms/frontend/src/components/consultation/VideoRoomModal.jsx', code);
console.log('VideoRoomModal updated.');
