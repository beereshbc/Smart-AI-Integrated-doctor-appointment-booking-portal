import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Clock, RefreshCw, AlertCircle, CheckCircle, Circle } from 'lucide-react';
import Loader from '../components/Loader';

const ChatWithDoctor = () => {
  const { appointmentId } = useParams();
  const { backendUrl, token, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const appointmentRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isAppointmentExpired = (item) => {
    try {
      const [day, month, year] = item.slotDate.split('_');
      const appointmentStart = new Date(`${month} ${day}, ${year} ${item.slotTime}`);
      const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000);
      const now = new Date();
      return now > appointmentEnd;
    } catch (err) {
      console.error("Error parsing appointment date:", err);
      return false;
    }
  };

  const loadChatHistory = async (doctorId, patientId, appointmentId) => {
    try {
      const requestPayload = {
        doctorId: String(doctorId),
        patientId: String(patientId),
        appointmentId: String(appointmentId)
      };

      const { data } = await axios.post(
        `${backendUrl}/api/chat/patient/chat-history`,
        requestPayload,
        {
          headers: { token },
          timeout: 15000
        }
      );

      if (data.success) {
        const receivedMessages = data.messages || [];
        const sortedMessages = receivedMessages.sort((a, b) =>
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMessages);
        return sortedMessages;
      } else {
        setError(data.message || 'Failed to load messages');
        setMessages([]);
        return [];
      }
    } catch (error) {
      if (error.response) {
        setError(`Server error: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        setError('No response from server');
      } else {
        setError('Failed to load chat history');
      }
      return [];
    }
  };

  const reloadMessages = async () => {
    if (appointmentRef.current && userData) {
      setLoading(true);
      await loadChatHistory(
        appointmentRef.current.docId,
        userData._id,
        appointmentRef.current._id
      );
      setLoading(false);
    }
  };

  const initializeSocket = (appointment) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socketConnection = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socketConnection;
    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      setConnectionStatus('connected');
      socketConnection.emit('join_chat', {
        doctorId: String(appointment.docId),
        patientId: String(userData._id),
        appointmentId: String(appointment._id)
      });
    });

    socketConnection.on('disconnect', () => setConnectionStatus('disconnected'));
    socketConnection.on('connect_error', () => setConnectionStatus('error'));

    socketConnection.on('reconnect', () => {
      setConnectionStatus('connected');
      socketConnection.emit('join_chat', {
        doctorId: String(appointment.docId),
        patientId: String(userData._id),
        appointmentId: String(appointment._id)
      });
      loadChatHistory(appointment.docId, userData._id, appointment._id);
    });

    socketConnection.on('receive_message', (message) => {
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        const updated = [...prev, message];
        return updated.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
    });

    socketConnection.on('message_sent', () => setSending(false));
    socketConnection.on('message_error', () => {
      setError('Failed to send message');
      setSending(false);
    });

    return socketConnection;
  };

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token }
      });

      if (data.success) {
        const appointment = data.appointments.find(apt => apt._id === appointmentId);

        if (!appointment) {
          setError('Appointment not found');
          setLoading(false);
          return;
        }

        if (appointment.cancelled) {
          setError('This appointment was cancelled');
          setLoading(false);
          return;
        }

        if (isAppointmentExpired(appointment)) {
          setError('This appointment has expired');
          setLoading(false);
          return;
        }

        setAppointmentData(appointment);
        appointmentRef.current = appointment;
        setDoctorInfo(appointment.docData);

        await loadChatHistory(appointment.docId, userData._id, appointment._id);
        initializeSocket(appointment);
      } else {
        setError(data.message || 'Failed to load appointments');
      }
    } catch {
      setError('Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !appointmentRef.current || sending) return;

    try {
      setSending(true);
      setError('');

      const messageText = newMessage.trim();
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setNewMessage('');

      const messageData = {
        appointmentId: String(appointmentRef.current._id),
        doctorId: String(appointmentRef.current.docId),
        patientId: String(userData._id),
        senderType: 'patient',
        message: messageText,
        timestamp: new Date().toISOString()
      };

      const tempMessage = { ...messageData, _id: tempId };
      setMessages(prev => [...prev, tempMessage]);
      socket.emit('send_message', messageData);

      setTimeout(() => {
        setMessages(prev => prev.filter(m => m._id !== tempId));
        setSending(false);
      }, 10000);

    } catch {
      setError('Failed to send message');
      setSending(false);
      setNewMessage(newMessage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (token && userData && appointmentId) {
      fetchAppointmentData();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, userData, appointmentId]);

  const getSafeImageUrl = (url, name = 'User') => {
    if (!url || !url.startsWith('http')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0EA5E9&color=fff&bold=true`;
    }
    return url;
  };

  if (loading) {
    return <Loader message="Loading your consultation..." />;
  }

  if (!doctorInfo || !appointmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl"
        >
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-600" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Chat Unavailable</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error || 'This consultation session could not be found'}</p>
          <button
            onClick={() => navigate('/my-appointments')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <ArrowLeft className="inline mr-2" size={18} />
            Back to Appointments
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Connection Status Badge */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 right-6 z-50"
      >
        <div className={`px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-2 ${
          connectionStatus === 'connected'
            ? 'bg-emerald-500/90 text-white'
            : connectionStatus === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-amber-500/90 text-white'
        }`}>
          <Circle 
            size={8} 
            className={connectionStatus === 'connected' ? 'fill-white animate-pulse' : 'fill-white/70'} 
          />
          {connectionStatus === 'connected'
            ? 'Connected'
            : connectionStatus === 'error'
              ? 'Connection Error'
              : 'Connecting...'}
        </div>
      </motion.div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/my-appointments')}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors group"
              title="Back to appointments"
            >
              <ArrowLeft size={22} className="text-gray-700 group-hover:text-blue-600 transition-colors" />
            </motion.button>

            <div className="relative">
              <img
                src={getSafeImageUrl(doctorInfo.image, doctorInfo.name)}
                alt={doctorInfo.name}
                className="w-14 h-14 rounded-2xl object-cover border-3 border-white shadow-lg ring-2 ring-blue-100"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-0.5">
                {doctorInfo.name}
              </h1>
              <p className="text-sm text-blue-600 font-medium">{doctorInfo.speciality}</p>
            </div>

            <div className="text-right bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-3 rounded-xl border border-blue-100">
              <p className="text-xs text-gray-600 mb-1 font-medium">Appointment</p>
              <p className="text-sm font-bold text-gray-900">
                {appointmentData.slotDate.split('_').join(' ')}
              </p>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">{appointmentData.slotTime}</p>
            </div>

            {/* Reload Button */}
          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reloadMessages}
              disabled={loading}
              className="flex items-center gap-2 text-xs bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-gray-200 shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Chat'}
            </motion.button>
          </div>
          </div>

          
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-5xl mx-auto px-6 py-4"
          >
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">Error occurred</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 h-[calc(100vh-300px)] flex flex-col overflow-hidden">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-full mb-6">
                  <Clock size={64} className="text-blue-300" />
                </div>
                <p className="text-xl font-semibold text-gray-600 mb-2">No messages yet</p>
                <p className="text-sm text-gray-400">Start your consultation with {doctorInfo.name}</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isTemp = message._id?.startsWith('temp-');
                const isPatientSender = message.senderType === 'patient';
                const avatarUrl = isPatientSender 
                  ? getSafeImageUrl(userData.image, userData.name) 
                  : getSafeImageUrl(doctorInfo.image, doctorInfo.name);
                const avatarAlt = isPatientSender ? userData.name : doctorInfo.name;

                return (
                  <motion.div
                    key={message._id || `msg-${index}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-end gap-3 ${
                      isPatientSender ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={avatarUrl}
                        alt={avatarAlt}
                        className={`w-10 h-10 rounded-xl object-cover shadow-md ring-2 ${
                          isPatientSender ? 'ring-blue-100' : 'ring-emerald-100'
                        }`}
                      />
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[70%] ${isPatientSender ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`px-5 py-3 rounded-2xl shadow-md ${
                          isPatientSender
                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-md'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 rounded-bl-md border border-gray-200'
                        } ${isTemp ? 'opacity-60' : ''}`}
                      >
                        {!isPatientSender && (
                          <p className="text-xs font-semibold text-blue-600 mb-1.5">{doctorInfo.name}</p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-1.5 justify-end mt-2">
                          <p
                            className={`text-xs ${
                              isPatientSender ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                          {isTemp && (
                            <Clock size={12} className={isPatientSender ? 'text-blue-200' : 'text-gray-400'} />
                          )}
                          {!isTemp && isPatientSender && (
                            <CheckCircle size={12} className="text-blue-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-5 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message to the doctor..."
                  className="w-full px-5 py-3.5 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-sm transition-all placeholder:text-gray-400"
                  disabled={sending || connectionStatus !== 'connected'}
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || connectionStatus !== 'connected'}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-2xl hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex-shrink-0"
                title="Send message"
              >
                {sending ? (
                  <RefreshCw size={22} className="animate-spin" />
                ) : (
                  <Send size={22} />
                )}
              </motion.button>
            </div>

            {/* Status Messages */}
            {connectionStatus !== 'connected' && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-500 mt-3 text-center font-medium flex items-center justify-center gap-2"
              >
                <AlertCircle size={14} />
                Cannot send messages - {connectionStatus === 'error' ? 'connection error' : 'connecting...'}
              </motion.p>
            )}
            {sending && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-blue-600 mt-3 text-center font-medium"
              >
                Sending your message...
              </motion.p>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">Secure & Private Consultation</p>
              <p className="text-sm text-blue-700">
                This chat is encrypted. {doctorInfo.name} will respond during working hours.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatWithDoctor;