import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRouter.js'
import doctorRouter from './routes/doctorRouter.js'
import userRouter from './routes/userRoute.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import ChatMessageModel from './models/chatModel.js'
import chatRouter from './routes/chatRouter.js'
import aiRoutes from "./routes/aiRoutes.js";

// app config
const app = express()
const server = createServer(app)
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:5174"
    ],
    methods: ["GET", "POST"]
  }
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  console.log('📊 Total connections:', io.engine.clientsCount);

  // Join a specific doctor-patient chat room
  socket.on('join_chat', (data) => {
    const roomId = `chat_${data.doctorId}_${data.patientId}`
    socket.join(roomId)
    console.log(`🎯 User ${socket.id} joined room: ${roomId}`);
    console.log('📦 Join data:', data);
    console.log('👥 Room members:', io.sockets.adapter.rooms.get(roomId)?.size || 0);
  })

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      console.log('📤 Message received from client:', {
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        senderType: data.senderType,
        message: data.message?.substring(0, 30)
      });
      
      // IMPORTANT: Convert IDs to strings to ensure consistency
      const messageData = {
        appointmentId: String(data.appointmentId),
        doctorId: String(data.doctorId),
        patientId: String(data.patientId),
        senderType: data.senderType,
        message: data.message
      };

      console.log('💾 Saving to DB with data:', {
        appointmentId: messageData.appointmentId,
        doctorId: messageData.doctorId,
        patientId: messageData.patientId,
        senderType: messageData.senderType
      });
      
      // Save message to database
      const chatMessage = new ChatMessageModel(messageData);
      await chatMessage.save();
      
      console.log('✅ Message saved to database:', {
        _id: chatMessage._id,
        appointmentId: chatMessage.appointmentId,
        doctorId: chatMessage.doctorId,
        patientId: chatMessage.patientId,
        senderType: chatMessage.senderType
      });

      // Prepare response
      const messageResponse = {
        _id: chatMessage._id,
        appointmentId: chatMessage.appointmentId,
        doctorId: chatMessage.doctorId,
        patientId: chatMessage.patientId,
        senderType: chatMessage.senderType,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp,
        read: chatMessage.read
      };

      // Emit to specific room
      const roomId = `chat_${data.doctorId}_${data.patientId}`;
      const roomMembers = io.sockets.adapter.rooms.get(roomId);
      console.log(`📨 Emitting to room: ${roomId}`);
      console.log('👥 Room members count:', roomMembers?.size || 0);
      
      io.to(roomId).emit('receive_message', messageResponse);
      console.log('✅ Message emitted successfully to room');

      // Also emit back to sender as confirmation
      socket.emit('message_sent', { 
        success: true, 
        messageId: chatMessage._id 
      });

    } catch (error) {
      console.error('❌ Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  })

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    console.log('📊 Remaining connections:', io.engine.clientsCount);
  })
})

// middlewares
// --- FIX: Increased limit to 50mb to handle images ---
app.use(express.json({ limit: '20mb' })) 
app.use(express.urlencoded({ limit: '20mb', extended: true }))
app.use(cors()) // Standard CORS for REST API

//api endpoints
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use("/api/ai", aiRoutes);

app.get('/', (req, res) => {
  res.send('API WORKING')
})

server.listen(port, () => 
  console.log("Server Started with Socket.io on port", port)
)

export { io }