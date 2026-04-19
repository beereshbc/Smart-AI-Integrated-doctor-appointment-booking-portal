import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    senderType: { type: String, required: true, enum: ['doctor', 'patient'] },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const ChatMessageModel = mongoose.models.chatmessage || mongoose.model('chatmessage', chatMessageSchema);

export default ChatMessageModel;