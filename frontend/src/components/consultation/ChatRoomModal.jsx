import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Download, 
  User, 
  Clock, 
  CheckCheck, 
  AlertCircle, 
  PhoneOff,
  MoreVertical,
  Smile
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import api from '../../services/api';
import { getSocket, joinSession, leaveSession } from '../../services/socket';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const ChatRoomModal = ({ isOpen, onClose, consultationData, onSessionEnd, onRequestPrescription }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isDoctor = user?.role === 'doctor';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load or Create Chat Session
  useEffect(() => {
    if (!isOpen || !consultationData) return;

    let isMounted = true;
    setLoading(true);

    // Socket listeners for call ending
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
    
    const initChatSession = async () => {
      try {
        let currentSession = null;

        // If session ID is provided directly
        if (consultationData.sessionId) {
          const res = await api.get(`/api/v1/chat-consultations/session/${consultationData.sessionId}`);
          currentSession = res.data.data;
        } else {
          // Create or retrieve session for this appointment or doctor/patient pair
          const payload = {
            appointmentId: consultationData.appointmentId || consultationData._id,
            doctorId: consultationData.doctor?._id || consultationData.doctor,
            patientId: consultationData.patient?._id || consultationData.patient
          };

          const sessionRes = await api.post('/api/v1/chat-consultations/create', payload);
          currentSession = sessionRes.data.data;
        }

        if (isMounted && currentSession) {
          setSession(currentSession);
          setIsClosed(currentSession.status === 'closed');

          // Fetch past messages
          const msgRes = await api.get(`/api/v1/chat-consultations/session/${currentSession._id}/messages?limit=100`);
          setMessages(msgRes.data.data?.messages || []);

          // Join socket session room
          joinSession(currentSession._id);
        }
      } catch (err) {
        console.error('Failed to initialize chat session:', err);
        addToast('error', err.response?.data?.message || 'Failed to connect to chat session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChatSession();

    // Socket listener for incoming messages
    const socket = getSocket();
    const handleIncomingMessage = (newMsg) => {
      if (newMsg && (!session || newMsg.session === session._id)) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    socket.on('receive_message', handleIncomingMessage);

    return () => {
      isMounted = false;
      if (session?._id) {
        leaveSession(session._id);
      }
      socket.off('receive_message', handleIncomingMessage);
    };
  }, [isOpen, consultationData]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !session || sending || isClosed) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await api.post('/api/v1/chat-consultations/send-message', {
        sessionId: session._id,
        content: text,
        messageType: 'text'
      });

      const sentMsg = res.data.data;
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === sentMsg._id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (err) {
      addToast('error', 'Failed to send message');
      setInputText(text); // restore
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session || isClosed) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return addToast('error', 'File size exceeds 10MB');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload file
      const uploadRes = await api.post('/api/v1/chat-consultations/upload', formData);
      const fileUrl = uploadRes.data.data?.url;

      // 2. Send message with uploaded file url
      const isImage = file.type.startsWith('image/');
      const msgRes = await api.post('/api/v1/chat-consultations/send-message', {
        sessionId: session._id,
        content: fileUrl,
        messageType: isImage ? 'image' : 'document'
      });

      const sentMsg = msgRes.data.data;
      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }
      addToast('success', 'File sent successfully');
    } catch (err) {
      addToast('error', 'Failed to upload and send file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEndSession = async () => {
    if (!session || isClosed) return;
    try {
      await api.put(`/api/v1/chat-consultations/session/${session._id}/end`);
      setIsClosed(true);
      addToast('info', 'Chat consultation ended.');
      if (onSessionEnd) onSessionEnd();
    } catch (err) {
      addToast('error', 'Failed to end session');
    }
  };

  const handleEndAndPrescribe = async () => {
    await handleEndSession();
    if (onRequestPrescription) {
      onRequestPrescription(consultationData);
    }
  };

  if (!isOpen || !consultationData) return null;

  const otherParticipantName = isDoctor 
    ? (consultationData.patient?.name || `${consultationData.patient?.firstName || ''} ${consultationData.patient?.lastName || ''}`.trim() || 'Patient')
    : (consultationData.doctor?.name || `Dr. ${consultationData.doctor?.user?.firstName || ''} ${consultationData.doctor?.user?.lastName || ''}`.trim() || 'Doctor');

  const otherSpecialization = isDoctor ? 'Patient' : (consultationData.doctor?.specialization || 'Medical Specialist');

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] max-h-[750px] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                {otherParticipantName.charAt(0).toUpperCase()}
              </div>
              {!isClosed && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base">{otherParticipantName}</h3>
                {isClosed ? (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                    Session Closed
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    Active Live
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{otherSpecialization}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isClosed && (
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
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Connecting to encrypted consultation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <MessageSquare size={28} />
              </div>
              <h4 className="font-semibold text-slate-800 text-base">Secure Live Chat</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                This chat is private and confidential. You can ask questions, describe symptoms, or share test reports.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = (isDoctor && msg.senderModel === 'Doctor') || (!isDoctor && msg.senderModel === 'Patient') || (msg.senderId === user?._id || msg.senderId === user?.id);
              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg._id || index}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {msg.senderModel === 'Doctor' ? 'Dr' : 'Pt'}
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-sm ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.messageType === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={`http://localhost:5000${msg.content}`}
                            alt="Attachment"
                            className="max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-95"
                            onClick={() => window.open(`http://localhost:5000${msg.content}`, '_blank')}
                          />
                        </div>
                      ) : msg.messageType === 'document' ? (
                        <a
                          href={`http://localhost:5000${msg.content}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg font-medium text-xs ${
                            isMine ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <FileText size={18} />
                          <span className="truncate max-w-[200px]">View Attachment Document</span>
                          <Download size={14} className="ml-1" />
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                    {timeStr}
                    {isMine && <CheckCheck size={12} className="text-indigo-400" />}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        {isClosed ? (
          <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
            This consultation session has ended. To start a new conversation, please schedule a consultation.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              title="Attach File or Image"
            >
              <Paperclip size={20} className={uploading ? 'animate-pulse text-indigo-600' : ''} />
            </button>

            <input
              type="text"
              placeholder="Type your medical query or response..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />

            <Button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-200"
            >
              <Send size={16} />
              <span className="hidden sm:inline text-xs font-semibold">Send</span>
            </Button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ChatRoomModal;
