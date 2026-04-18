import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Search,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  CheckCheck,
  Check,
  Circle,
  Phone,
  Video,
  Info,
  ArrowLeft
} from 'lucide-react';
import Loader from '../../components/Loader';

// ✅ Helper function to check if appointment is expired
const isAppointmentExpired = (appointment) => {
  if (!appointment?.slotDate || !appointment?.slotTime) return false;

  try {
    const [day, month, year] = appointment.slotDate.split('_');
    const appointmentStart = new Date(`${month} ${day}, ${year} ${appointment.slotTime}`);

    // Add 30 minutes to represent session end time
    const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000);

    const now = new Date();
    return now > appointmentEnd;
  } catch (err) {
    console.error("Error parsing appointment date:", err);
    return false;
  }
};

// ✅ Helper function to get appointment end time
const getAppointmentEndTime = (appointment) => {
  if (!appointment?.slotDate || !appointment?.slotTime) return null;

  try {
    const [day, month, year] = appointment.slotDate.split('_');
    const appointmentStart = new Date(`${month} ${day}, ${year} ${appointment.slotTime}`);
    const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000);
    return appointmentEnd;
  } catch (err) {
    console.error("Error getting appointment end time:", err);
    return null;
  }
};

const ChatWithPatient = () => {
  const { backendUrl, dToken, profileData, getProfileData } = useContext(DoctorContext);
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [appointmentInfo, setAppointmentInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatList = async (doctorId) => {
    try {
      setError('');

      if (!doctorId) {
        throw new Error('Doctor ID not available');
      }

      const { data } = await axios.post(
        `${backendUrl}/api/chat/doctor/chat-list`,
        { docId: doctorId },
        {
          headers: { dtoken: dToken },
          timeout: 10000
        }
      );

      if (data.success) {
        setChatList(data.chatList || []);

        if (data.chatList && data.chatList.length > 0) {
          const firstPatient = data.chatList[0];
          setSelectedPatient(firstPatient);
          await loadChatHistory(firstPatient.patientId, doctorId);
        }
        return true;
      } else {
        setError(data.message || 'Failed to load chat list');
        return false;
      }
    } catch (error) {
      console.error('❌ Error loading chat list:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your internet connection.');
      } else {
        setError(error.message || 'Failed to load conversations.');
      }
      return false;
    }
  };

  const loadChatHistory = async (patientId, doctorId = null) => {
    try {
      const currentDoctorId = doctorId || profileData?._id;

      if (!currentDoctorId || !patientId) {
        console.error('Missing required data for loading chat history');
        return;
      }

      const { data: appointmentsData } = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        {
          headers: { dtoken: dToken },
          timeout: 10000
        }
      );

      if (appointmentsData.success) {
        const patientAppointments = appointmentsData.appointments.filter(
          apt => apt.userId === patientId
        );

        if (patientAppointments.length > 0) {
          const patientAppointment = patientAppointments[0];

          // ✅ Store appointment info
          setAppointmentInfo(patientAppointment);

          const { data: chatData } = await axios.post(
            `${backendUrl}/api/chat/doctor/chat-history`,
            {
              doctorId: currentDoctorId,
              patientId: patientId,
              appointmentId: patientAppointment._id
            },
            {
              headers: { dtoken: dToken },
              timeout: 10000
            }
          );

          if (chatData.success) {
            const sortedMessages = (chatData.messages || []).sort((a, b) =>
              new Date(a.timestamp) - new Date(b.timestamp)
            );
            setMessages(sortedMessages);
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
          setAppointmentInfo(null);
        }
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      setMessages([]);
    }
  };

  const fetchPatientInfo = async (patientId) => {
    try {
      const { data: appointmentsData } = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        { headers: { dtoken: dToken } }
      );
      if (appointmentsData.success) {
        const patientAppointment = appointmentsData.appointments.find(
          apt => apt.userId === patientId
        );

        if (patientAppointment && patientAppointment.userData) {
          return patientAppointment.userData;
        }
      }
    } catch (error) {
      console.error('Error fetching patient info:', error);
    }
    return null;
  };

  const initializeSocket = (doctorId) => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socketConnection = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current = socketConnection;
      setSocket(socketConnection);

      socketConnection.on('connect', () => {
        console.log('✅ Doctor Socket connected');
        setConnectionStatus('connected');
      });

      socketConnection.on('disconnect', (reason) => {
        console.log('❌ Doctor Socket disconnected:', reason);
        setConnectionStatus('disconnected');
      });

      socketConnection.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnectionStatus('error');
      });

      socketConnection.on('receive_message', (message) => {
        if (selectedPatient && message.patientId === selectedPatient.patientId) {
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === message._id);
            const tempExists = prev.some(msg =>
              msg.message === message.message &&
              msg.senderType === message.senderType &&
              msg._id.startsWith('temp-')
            );

            if (!exists) {
              if (message.senderType === 'doctor' && tempExists) {
                const filtered = prev.filter(msg =>
                  !(msg.message === message.message &&
                    msg.senderType === message.senderType &&
                    msg._id.startsWith('temp-'))
                );
                return [...filtered, message];
              }
              return [...prev, message];
            }
            return prev;
          });
        }

        setChatList(prev => {
          const updatedList = prev.map(chat =>
            chat.patientId === message.patientId
              ? {
                ...chat,
                lastMessage: message.message,
                lastMessageTime: message.timestamp
              }
              : chat
          );

          const patientExists = prev.some(chat => chat.patientId === message.patientId);
          if (!patientExists && message.senderType === 'patient') {
            fetchPatientInfo(message.patientId).then(patientInfo => {
              if (patientInfo) {
                setChatList(currentList => [
                  {
                    patientId: message.patientId,
                    patientName: patientInfo.name,
                    patientImage: patientInfo.image,
                    lastMessage: message.message,
                    lastMessageTime: message.timestamp,
                    unreadCount: 1
                  },
                  ...currentList
                ]);
              }
            });
          }

          return updatedList.sort((a, b) =>
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
          );
        });
      });

      return socketConnection;
    } catch (socketError) {
      console.error('❌ Failed to initialize socket:', socketError);
      setConnectionStatus('error');
      return null;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !selectedPatient || !profileData?._id) {
      return;
    }

    try {
      setSending(true);

      const { data: appointmentsData } = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        { headers: { dtoken: dToken } }
      );

      if (appointmentsData.success) {
        const patientAppointments = appointmentsData.appointments.filter(
          apt => apt.userId === selectedPatient.patientId
        );

        if (patientAppointments.length > 0) {
          const patientAppointment = patientAppointments[0];

          const messageText = newMessage.trim();
          setNewMessage('');

          const messageData = {
            appointmentId: patientAppointment._id,
            doctorId: profileData._id,
            patientId: selectedPatient.patientId,
            senderType: 'doctor',
            message: messageText
          };

          socket.emit('send_message', messageData);

          socket.emit('join_chat', {
            doctorId: profileData._id,
            patientId: selectedPatient.patientId
          });

          const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            ...messageData,
            timestamp: new Date(),
            read: false
          };

          setMessages(prev => [...prev, optimisticMessage]);
        } else {
          setError('No appointment found for this patient.');
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setMessages([]);
    setAppointmentInfo(null);
    await loadChatHistory(patient.patientId);

    if (socket && socket.connected && profileData?._id) {
      socket.emit('join_chat', {
        doctorId: profileData._id,
        patientId: patient.patientId
      });
    }
  };

  const handleMobileBack = () => {
    setSelectedPatient(null);
    setMessages([]);
    setAppointmentInfo(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    isInitializedRef.current = false;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    try {
      let currentProfile = profileData;
      if (!currentProfile) {
        await getProfileData();
        await new Promise(resolve => setTimeout(resolve, 500));
        currentProfile = profileData;
      }

      if (currentProfile?._id) {
        initializeSocket(currentProfile._id);
        const success = await loadChatList(currentProfile._id);

        if (success) {
          isInitializedRef.current = true;
        }
      } else {
        setError('Unable to load doctor profile. Please try logging in again.');
      }
    } catch (error) {
      console.error('Retry error:', error);
      setError('Failed to initialize chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return 'No messages';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 1) return date.toLocaleDateString();
      return formatTime(timestamp);
    } catch {
      return 'Recently';
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredChatList = chatList.filter(chat =>
    chat.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSafeImageUrl = (url) => {
    if (!url || url === 'data:image/png') {
      return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239CA3AF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\' /%3E%3C/svg%3E';
    }
    return url;
  };

  // ✅ System Message Component (WhatsApp style)
  const SystemMessage = ({ message, icon }) => (
    <div className="flex justify-center my-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 px-4 py-2 rounded-lg shadow-sm max-w-xs"
      >
        <div className="flex items-center gap-2 justify-center">
          {icon}
          <p className="text-xs font-semibold text-amber-800 text-center">
            {message}
          </p>
        </div>
      </motion.div>
    </div>
  );

  // ✅ Insert "Session Ended" message in chronological order
  const insertSessionEndedMarker = (messages, appointmentEndTime) => {
    if (!appointmentEndTime) return messages;

    const result = [];
    let sessionEndedInserted = false;

    for (let i = 0; i < messages.length; i++) {
      const currentMsg = messages[i];
      const currentMsgTime = new Date(currentMsg.timestamp);

      // Insert "Session Ended" before the first message AFTER the end time
      if (!sessionEndedInserted && currentMsgTime > appointmentEndTime) {
        result.push({
          _id: 'session-ended-marker',
          type: 'system',
          timestamp: appointmentEndTime,
          message: 'Session Ended • consultation completed'
        });
        sessionEndedInserted = true;
      }

      result.push(currentMsg);
    }

    // If all messages are before end time, add marker at the end
    if (!sessionEndedInserted && messages.length > 0) {
      const lastMsgTime = new Date(messages[messages.length - 1].timestamp);
      if (lastMsgTime < appointmentEndTime && new Date() > appointmentEndTime) {
        result.push({
          _id: 'session-ended-marker',
          type: 'system',
          timestamp: appointmentEndTime,
          message: 'Session Ended • consultation completed'
        });
      }
    }

    return result;
  };

  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }

    if (!dToken) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    const initializeChat = async () => {
      try {
        setLoading(true);
        setError('');

        loadingTimeoutRef.current = setTimeout(() => {
          if (loading && !isInitializedRef.current) {
            console.warn('⚠️ Loading timeout');
            setLoading(false);
            setError('Loading is taking longer than expected. Please try refreshing.');
          }
        }, 30000);

        let currentProfile = profileData;
        if (!currentProfile) {
          console.log('📥 Loading profile data...');
          await getProfileData();
          await new Promise(resolve => setTimeout(resolve, 1000));
          setLoading(false);
          return;
        }

        if (!currentProfile._id) {
          throw new Error('Doctor profile not available. Please complete your profile setup.');
        }

        console.log('✅ Profile loaded:', currentProfile.name);

        console.log('🔌 Initializing socket...');
        const socketConnection = initializeSocket(currentProfile._id);

        console.log('📋 Loading chat list...');
        const success = await loadChatList(currentProfile._id);

        if (success) {
          console.log('✅ Chat initialized successfully');
          isInitializedRef.current = true;
        }

      } catch (error) {
        console.error('❌ Initialization error:', error);
        setError(error.message || 'Failed to initialize chat');
      } finally {
        setLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    };

    initializeChat();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [dToken, profileData?._id]);

  // 🔄 Auto-refresh when returning to this browser tab
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.location.reload();  // 🔥 Refresh the page automatically
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Unable to Load Chat</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all duration-200"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
            <button
              onClick={() => navigate('/doctor-dashboard')}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader message="Loading your messages..." />
          </div>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden w-full">

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 mt-10 mr-6 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${connectionStatus === 'connected'
            ? 'bg-emerald-500/90 text-white'
            : connectionStatus === 'error'
              ? 'bg-rose-500/90 text-white'
              : 'bg-amber-500/90 text-white'
            }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Circle
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${connectionStatus === 'connected' ? 'fill-white' : 'fill-white/70'} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}
            />
            <span className="hidden sm:inline">
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Sidebar - Chat List */}
      <div className={`
        ${selectedPatient ? 'hidden md:flex' : 'flex'}
        w-full md:w-80 lg:w-96 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex-col shadow-xl
      `}>
        <div className="p-4 sm:p-6 border-b rounded-lg border-gray-200/50 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              Messages
            </h1>
            <div className="bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 rounded-full">
              <span className="text-white text-xs sm:text-sm font-semibold">{chatList.length}</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/90 backdrop-blur-sm border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base text-gray-900 placeholder-gray-500 shadow-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <p className="text-center font-semibold text-gray-900 mb-2 text-base sm:text-lg">No conversations yet</p>
              <p className="text-xs sm:text-sm text-center text-gray-500 max-w-xs">
                When patients send you messages, they will appear here.
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredChatList.map((patient, index) => (
                <motion.div
                  key={patient.patientId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePatientSelect(patient)}
                  className={`p-3 sm:p-4 mb-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 ${selectedPatient?.patientId === patient.patientId
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg scale-[1.02]'
                    : 'bg-white hover:bg-gray-50 hover:shadow-md'
                    }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative">
                      <img
                        src={getSafeImageUrl(patient.patientImage)}
                        alt={patient.patientName}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover border-2 sm:border-3 border-white shadow-md"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <h3 className={`font-bold truncate text-sm sm:text-base ${selectedPatient?.patientId === patient.patientId ? 'text-white' : 'text-gray-900'
                          }`}>
                          {patient.patientName || 'Unknown Patient'}
                        </h3>
                        <span className={`text-xs whitespace-nowrap ml-2 font-medium ${selectedPatient?.patientId === patient.patientId ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                          {formatMessageDate(patient.lastMessageTime)}
                        </span>
                      </div>

                      <p className={`text-xs sm:text-sm truncate ${selectedPatient?.patientId === patient.patientId ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                        {patient.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {patient.unreadCount > 0 && selectedPatient?.patientId !== patient.patientId && (
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg flex-shrink-0">
                        {patient.unreadCount}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`
        ${selectedPatient ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col w-full bg-white/50 backdrop-blur-sm transition-all duration-300
      `}>
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200/50 p-3 sm:p-5 bg-white/80 backdrop-blur-xl shadow-sm">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <button
                    onClick={handleMobileBack}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <img
                      src={getSafeImageUrl(selectedPatient.patientImage)}
                      alt={selectedPatient.patientName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-blue-500 shadow-md"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 text-sm sm:text-lg truncate">
                      {selectedPatient.patientName || 'Unknown Patient'}
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-600 font-medium flex items-center gap-1">
                      <Circle className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-emerald-500 animate-pulse" />
                      Active now
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button className="p-2 sm:p-3 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-colors group">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-600" />
                  </button>
                  <button className="hidden sm:block p-3 hover:bg-blue-50 rounded-xl transition-colors group">
                    <Video className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  </button>
                  <button className="hidden sm:block p-3 hover:bg-blue-50 rounded-xl transition-colors group">
                    <Info className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar w-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            >
              <div className="w-full h-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <Clock size={40} className="sm:w-12 sm:h-12 text-blue-600" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No messages yet</p>
                    <p className="text-xs sm:text-sm text-gray-500 text-center max-w-sm px-4">
                      Start the conversation by sending a message to your patient.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {Object.entries(groupedMessages).map(([date, msgs]) => {
                      // ✅ Insert session ended marker chronologically within messages
                      const appointmentEndTime = appointmentInfo ? getAppointmentEndTime(appointmentInfo) : null;
                      const messagesWithMarker = insertSessionEndedMarker(msgs, appointmentEndTime, appointmentInfo);
                      return (
                        <div key={date}>
                          <div className="flex items-center justify-center my-4 sm:my-6">
                            <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-md border border-gray-200/50">
                              <span className="text-xs font-semibold text-gray-600">
                                {formatDateHeader(date)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            {messagesWithMarker.map((message, index) => {
                              // ✅ System message (Session Ended)
                              if (message.type === 'system') {
                                return (
                                  <SystemMessage
                                    key={message._id}
                                    message={message.message}
                                    icon={<AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                                  />
                                );
                              }

                              // Regular message
                              const isCurrentUserSender = message.senderType === 'doctor';
                              const isTempMessage = message._id && message._id.toString().startsWith('temp-');
                              const showAvatar = index === 0 ||
                                messagesWithMarker[index - 1].type === 'system' ||
                                messagesWithMarker[index - 1].senderType !== message.senderType;

                              return (
                                <motion.div
                                  key={message._id || `temp-${message.timestamp}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex items-end gap-1.5 sm:gap-2 ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
                                >
                                  {!isCurrentUserSender && (
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                      <img
                                        src={getSafeImageUrl(selectedPatient.patientImage)}
                                        alt="Patient"
                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-md"
                                      />
                                    </div>
                                  )}

                                  <div
                                    className={`max-w-[85%] sm:max-w-lg px-3 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-md ${isCurrentUserSender
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200/50'
                                      } ${isTempMessage ? 'opacity-70' : ''}`}
                                  >
                                    <p className="text-xs sm:text-sm leading-relaxed break-words">{message.message}</p>
                                    <div
                                      className={`flex items-center gap-1 mt-1 ${isCurrentUserSender ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                      <span
                                        className={`text-[10px] sm:text-xs ${isCurrentUserSender ? 'text-blue-100' : 'text-gray-500'
                                          }`}
                                      >
                                        {formatTime(message.timestamp)}
                                      </span>
                                      {isCurrentUserSender && (
                                        <span>
                                          {isTempMessage ? (
                                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-200" />
                                          ) : message.read ? (
                                            <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" />
                                          ) : (
                                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {isCurrentUserSender && (
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                      <img
                                        src={getSafeImageUrl(profileData?.image)}
                                        alt={profileData?.name || 'You'}
                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-md"
                                      />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200/50 p-3 sm:p-5 bg-white/80 backdrop-blur-xl">
              <div className="flex gap-2 sm:gap-3 items-end max-w-5xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-3 py-2.5 sm:px-5 sm:py-4 pr-10 sm:pr-12 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-sm text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    disabled={sending || connectionStatus !== 'connected'}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending || connectionStatus !== 'connected'}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none group flex-shrink-0"
                >
                  <Send size={18} className="sm:w-[22px] sm:h-[22px] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                <MessageCircle size={48} className="sm:w-16 sm:h-16 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No chat selected</h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto px-4">
                {chatList.length === 0
                  ? "When patients message you, their conversations will appear in the sidebar."
                  : "Select a patient from the list to start chatting."}
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }

        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWithPatient;