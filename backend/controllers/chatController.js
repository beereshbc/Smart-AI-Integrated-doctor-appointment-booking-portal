import ChatMessageModel from "../models/chatModel.js"
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
import doctorModel from "../models/doctorModel.js"

// API to get chat history between doctor and patient
const getChatHistory = async (req, res) => {
  try {
    const { doctorId, patientId, appointmentId } = req.body

    console.log('🔍 getChatHistory called with:', {
      doctorId,
      patientId,
      appointmentId
    });

    // Verify the appointment exists (optional check, not for filtering)
    const appointment = await appointmentModel.findOne({
      _id: appointmentId,
      docId: doctorId,
      userId: patientId
    })

    if (!appointment) {
      console.log('❌ Appointment not found or unauthorized');
      return res.json({ success: false, message: "Appointment not found or unauthorized" })
    }

    console.log('✅ Appointment found:', appointment._id);

    // FIXED QUERY - Get all messages between doctor and patient
    // Don't filter by appointmentId since doctor might be using different one
    const messages = await ChatMessageModel.find({
      doctorId: doctorId,
      patientId: patientId
      // Removed appointmentId filter
    }).sort({ timestamp: 1 })

    console.log('📊 Messages found:', {
      total: messages.length,
      doctor: messages.filter(m => m.senderType === 'doctor').length,
      patient: messages.filter(m => m.senderType === 'patient').length
    });

    res.json({ success: true, messages })

  } catch (error) {
    console.error('❌ Error in getChatHistory:', error)
    res.json({ success: false, message: error.message })
  }
}

// TEMPORARY DEBUG ENDPOINT
const debugMessages = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId } = req.body;

    console.log('🔍 DEBUG: Searching for messages with:', {
      appointmentId,
      doctorId,
      patientId
    });

    // Get ALL messages for this appointment
    const allMessages = await ChatMessageModel.find({});
    
    // Filter messages that might be related
    const relatedMessages = allMessages.filter(msg => 
      msg.appointmentId === appointmentId || 
      msg.doctorId === doctorId || 
      msg.patientId === patientId
    );

    console.log('📊 Found related messages:', relatedMessages.length);

    const analysis = relatedMessages.map(msg => ({
      _id: msg._id,
      senderType: msg.senderType,
      message: msg.message.substring(0, 30),
      appointmentId: msg.appointmentId,
      appointmentIdMatch: msg.appointmentId === appointmentId,
      doctorId: msg.doctorId,
      doctorIdMatch: msg.doctorId === doctorId,
      patientId: msg.patientId,
      patientIdMatch: msg.patientId === patientId,
      allMatch: msg.appointmentId === appointmentId && 
                msg.doctorId === doctorId && 
                msg.patientId === patientId
    }));

    console.log('🔬 Detailed analysis:', JSON.stringify(analysis, null, 2));

    res.json({
      success: true,
      totalInDB: allMessages.length,
      relatedMessages: relatedMessages.length,
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor's chat list (patients they have chatted with)
const getDoctorChatList = async (req, res) => {
  try {
    const { docId } = req.body;

    const uniquePatientIds = await ChatMessageModel.distinct('patientId', { doctorId: docId });

    if (uniquePatientIds.length === 0) {
      return res.json({ success: true, chatList: [] });
    }

    const chatList = await Promise.all(
      uniquePatientIds.map(async (patientId) => {
        const lastMessage = await ChatMessageModel.findOne(
          { doctorId: docId, patientId },
          {},
          { sort: { timestamp: -1 } }
        );

        const patientData = await userModel.findById(patientId).select('name image');

        return {
          patientId,
          patientName: patientData?.name || 'Unknown Patient',
          patientImage: patientData?.image || 'data:image/png',
          lastMessage: lastMessage?.message || 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || new Date(),
          unreadCount: 0
        };
      })
    );

    chatList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ success: true, chatList });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get patient's chat list (doctors they have chatted with)
const getPatientChatList = async (req, res) => {
  try {
    const { patientId } = req.body;

    const uniqueDoctorIds = await ChatMessageModel.distinct('doctorId', { patientId });

    if (uniqueDoctorIds.length === 0) {
      return res.json({ success: true, chatList: [] });
    }

    const chatList = await Promise.all(
      uniqueDoctorIds.map(async (doctorId) => {
        const lastMessage = await ChatMessageModel.findOne(
          { patientId, doctorId },
          {},
          { sort: { timestamp: -1 } }
        );

        const doctorData = await doctorModel.findById(doctorId).select('name image speciality');

        return {
          doctorId,
          doctorName: doctorData?.name || 'Unknown Doctor',
          doctorImage: doctorData?.image || 'data:image/png',
          doctorSpeciality: doctorData?.speciality || 'General Physician',
          lastMessage: lastMessage?.message || 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || new Date(),
          unreadCount: 0
        };
      })
    );

    chatList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ success: true, chatList });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { getChatHistory, getDoctorChatList, getPatientChatList, debugMessages }