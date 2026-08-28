const fs = require('fs');
let code = fs.readFileSync('c:/Users/laxma/hms/frontend/src/pages/doctor/Appointments.jsx', 'utf8');

// 1. Add Import
code = code.replace(
  'import ChatRoomModal from \'../../components/consultation/ChatRoomModal\';',
  'import ChatRoomModal from \'../../components/consultation/ChatRoomModal\';\nimport ConsultationFormModal from \'../../components/consultation/ConsultationFormModal\';'
);

// 2. Remove States for Modal
const stateRegex = /\/\/ Consultation Modal States[\s\S]*?const \[cancelModal, setCancelModal\] = useState\(\{ isOpen: false, appointmentId: null, reason: \'\' \}\);/;
code = code.replace(stateRegex, 'const [showConsultationModal, setShowConsultationModal] = useState(false);\n  const [selectedAppt, setSelectedAppt] = useState(null);\n\n  const handleStartConsultation = (appt) => {\n    setSelectedAppt(appt);\n    setShowConsultationModal(true);\n  };\n\n  const [cancelModal, setCancelModal] = useState({ isOpen: false, appointmentId: null, reason: \'\' });');

// 3. Keep handleUpdateStatus and handleCancelSubmit. Remove handleStartConsultation (the old one) and handleSubmitConsultation, handleRequestIPD, handleAddMedicine, etc.
// The old handleStartConsultation started at `const handleStartConsultation = (appt) => {` and ended before `const columns = [`
const methodsRegex = /const handleStartConsultation = \(appt\) => \{[\s\S]*?const columns = \[/;
code = code.replace(methodsRegex, 'const columns = [');

// 4. Remove fetchInventory and fetchLabInventory from useEffect
code = code.replace(/useEffect\(\(\) => \{\n    fetchInventory\(\);\n    fetchLabInventory\(\);\n  \}, \[\]\);\n/, '');
code = code.replace(/const fetchInventory = async \(\) => \{[\s\S]*?const fetchLabInventory = async \(\) => \{[\s\S]*?\}\s*};\s*const fetchAppointments = async \(\) => \{/m, 'const fetchAppointments = async () => {');

// 5. Replace the big JSX modal with the component
const startJSX = '{/* Consultation Modal */}';
const endJSX = '{activeVideoAppt && (';
const startIdx = code.indexOf(startJSX);
const endIdx = code.indexOf(endJSX);
if(startIdx !== -1 && endIdx !== -1) {
  const toReplace = code.substring(startIdx, endIdx);
  code = code.replace(toReplace, '<ConsultationFormModal \n        isOpen={showConsultationModal}\n        onClose={() => setShowConsultationModal(false)}\n        selectedAppt={selectedAppt}\n        onSuccess={fetchAppointments}\n      />\n\n      ');
}

// 6. Update VideoRoomModal props
code = code.replace(
  'onConsultationComplete={fetchAppointments}',
  'onConsultationComplete={() => {\n            setActiveVideoAppt(null);\n            fetchAppointments();\n          }}\n          onRequestPrescription={(appt) => {\n            setActiveVideoAppt(null);\n            handleStartConsultation(appt);\n          }}'
);

// 7. Update ChatRoomModal props
code = code.replace(
  'onSessionEnd={fetchAppointments}',
  'onSessionEnd={() => {\n            setActiveChatAppt(null);\n            fetchAppointments();\n          }}\n          onRequestPrescription={(appt) => {\n            setActiveChatAppt(null);\n            handleStartConsultation(appt);\n          }}'
);

fs.writeFileSync('c:/Users/laxma/hms/frontend/src/pages/doctor/Appointments.jsx', code);
console.log('Done');
