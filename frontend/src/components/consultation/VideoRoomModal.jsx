import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  Maximize2, 
  Minimize2, 
  Copy, 
  ExternalLink, 
  X, 
  Check, 
  FileText, 
  User, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const VideoRoomModal = ({ isOpen, onClose, consultationData, onConsultationComplete, onRequestPrescription }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showNotesPanel, setShowNotesPanel] = useState(false);

  // Doctor clinical notes state (if doctor is viewing)
  const [clinicalNotes, setClinicalNotes] = useState({
    diagnosis: '',
    symptoms: '',
    prescriptionNotes: ''
  });
  const [savingNotes, setSavingNotes] = useState(false);

  const modalRef = useRef(null);
  const timerRef = useRef(null);

  const isDoctor = user?.role === 'doctor';

  // Initialize or fetch meeting link & ring patient if doctor
  useEffect(() => {
    if (!isOpen || !consultationData) return;

    let isMounted = true;
    setLoading(true);
    setTimerSeconds(0);

    useEffect(() => {
    const s = getSocket();
    if (s && isOpen && consultationData) {
      const handleEndCallEvent = (data) => {
        const apptId = consultationData.appointmentId || consultationData._id;
        const incomingApptId = data?.appointment?._id || data?.appointment;
        if (apptId && incomingApptId && apptId.toString() === incomingApptId.toString()) {
          addToast('info', 'Call ended by the host.');
          if (timerRef.current) clearInterval(timerRef.current);
          onClose();
        }
      };
      s.on('end_call', handleEndCallEvent);
      return () => {
        s.off('end_call', handleEndCallEvent);
      };
    }
  }, [isOpen, consultationData, onClose, addToast]);

  const initMeeting = async () => {
      try {
        const apptId = consultationData.appointmentId || consultationData._id || 'room';
        const cleanId = typeof apptId === 'string' ? apptId : apptId.toString();
        const baseRoomName = `HMS-Telehealth-${cleanId.replace(/[^a-zA-Z0-9]/g, '')}`;
        let link = `https://meet.jit.si/${baseRoomName}#config.prejoinPageEnabled=false`;

        // If user is a Doctor starting the call, ring the patient in real time
        if (isDoctor) {
          try {
            const s = getSocket();
            if (s) {
              s.emit('start_call', {
                toUserId: consultationData.patient?._id || consultationData.patient,
                patientUserIds: [consultationData.patient?.user?._id, consultationData.patient?.user, consultationData.patient?._id],
                appointment: consultationData,
                callerName: `Dr. ${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Attending Doctor',
                type: consultationData.appointmentType || 'video'
              });
            }
          } catch (sockErr) {
            console.warn('Socket ring notice:', sockErr);
          }
        }

        if (isMounted) {
          const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (isDoctor ? 'Doctor' : 'Patient');
          const enhancedLink = `${link}&userInfo.displayName="${encodeURIComponent(userName)}"`;
          
          setMeetingLink(enhancedLink);
          setLoading(false);

          // Start consultation call timer
          timerRef.current = setInterval(() => {
            setTimerSeconds(prev => prev + 1);
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to initialize video meeting:', err);
        const fallback = `https://meet.jit.si/HMS-Room-${Date.now().toString().slice(-6)}`;
        if (isMounted) {
          setMeetingLink(fallback);
          setLoading(false);
        }
      }
    };

    initMeeting();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, consultationData]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    if (!meetingLink) return;
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    addToast('success', 'Meeting link copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      const s = getSocket();
      if (s) {
        s.emit('end_call', {
          appointment: consultationData
        });
      }
    } catch (err) { console.error(err); }

    addToast('info', 'Video room closed.');
    onClose();
  };

  const handleEndAndPrescribe = () => {
    handleEndCall();
    if (onRequestPrescription) {
      onRequestPrescription(consultationData);
    }
  };

  const handleSaveNotes = async () => {
    if (!clinicalNotes.diagnosis) {
      return addToast('error', 'Please enter a clinical diagnosis');
    }
    setSavingNotes(true);
    try {
      await api.post('/api/v1/consultations', {
        appointment: consultationData.appointmentId || consultationData._id,
        patient: consultationData.patient?._id || consultationData.patient,
        diagnosis: clinicalNotes.diagnosis,
        symptoms: clinicalNotes.symptoms,
        clinicalNotes: clinicalNotes.prescriptionNotes
      });

      // After explicitly saving clinical notes, mark appointment as completed
      await api.patch(`/api/v1/appointments/${consultationData.appointmentId || consultationData._id}/status`, {
        status: 'completed'
      }).catch(() => {});

      addToast('success', 'Consultation & Clinical Notes saved successfully! Visit completed.');
      setShowNotesPanel(false);
      if (onConsultationComplete) onConsultationComplete();
      onClose();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to save clinical notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen || !consultationData) return null;

  const otherParticipantName = isDoctor 
    ? (consultationData.patient?.name || `${consultationData.patient?.firstName || ''} ${consultationData.patient?.lastName || ''}`.trim() || 'Patient')
    : (consultationData.doctor?.name || `Dr. ${consultationData.doctor?.user?.firstName || ''} ${consultationData.doctor?.user?.lastName || ''}`.trim() || 'Doctor');

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className={`bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border border-slate-800 ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-6xl h-[92vh] max-h-[850px]'
        }`}
      >
        {/* Top Meeting Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Video size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-base">
                  Consultation with {otherParticipantName}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Encrypted HD
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  Duration: <strong className="text-white font-mono">{formatTimer(timerSeconds)}</strong>
                </span>
                <span>•</span>
                <span>Type: Video Call</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="text-xs hidden sm:flex items-center gap-1.5 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
              title="Copy meeting link"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Share Link'}
            </Button>

            <button
              onClick={() => window.open(meetingLink, '_blank')}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Open in new window"
            >
              <ExternalLink size={16} />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={handleEndCall}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Meeting Body & Optional Notes Panel */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Video Frame */}
          <div className="flex-1 h-full bg-black relative flex flex-col justify-center items-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Connecting to secure consultation room...</p>
              </div>
            ) : meetingLink ? (
              <iframe
                src={meetingLink}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-0"
                title="HMS Secure Video Consultation"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <AlertCircle size={32} className="mx-auto text-amber-400 mb-2" />
                <p className="font-semibold text-slate-200">Unable to load video room</p>
                <p className="text-xs text-slate-500 mt-1">Please try rejoining or refresh the consultation.</p>
              </div>
            )}
          </div>

          {/* Doctor Clinical Notes Side-Drawer */}
          {showNotesPanel && isDoctor && (
            <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" />
                    Live Consultation Notes
                  </h3>
                  <button onClick={() => setShowNotesPanel(false)} className="text-slate-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Chief Symptoms</label>
                  <textarea
                    rows={2}
                    placeholder="E.g., High fever, sore throat..."
                    value={clinicalNotes.symptoms}
                    onChange={(e) => setClinicalNotes(p => ({ ...p, symptoms: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Diagnosis *</label>
                  <input
                    type="text"
                    placeholder="E.g., Acute Viral Pharyngitis"
                    value={clinicalNotes.diagnosis}
                    onChange={(e) => setClinicalNotes(p => ({ ...p, diagnosis: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Prescription & Advice</label>
                  <textarea
                    rows={4}
                    placeholder="Instructions, medications, or rest recommendations..."
                    value={clinicalNotes.prescriptionNotes}
                    onChange={(e) => setClinicalNotes(p => ({ ...p, prescriptionNotes: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs py-2"
                >
                  {savingNotes ? 'Saving...' : 'Save Diagnosis & Notes'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Control Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>End-to-End Encrypted Session</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
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
            )}
          </div>

          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            HMS Telehealth v2.0
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VideoRoomModal;
