import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'

import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRouter.js'
import doctorRouter from './routes/doctorRouter.js'
import userRouter from './routes/userRoute.js'
import chatRouter from './routes/chatRoute.js'

import chatModel from './models/chatModel.js'
import userModel from './models/userModel.js'

// ── App & HTTP server ─────────────────────────────────────────────────────────
const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 4000

// ── DB & Cloudinary ───────────────────────────────────────────────────────────
connectDB()
connectCloudinary()

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(express.json())
app.use(cors())

// ── REST API endpoints ────────────────────────────────────────────────────────
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)

app.get('/', (_req, res) => res.send('API WORKING'))

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

// Basic profanity filter
const PROFANITY = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'crap']
const filterProfanity = (text) => {
    let filtered = text
    PROFANITY.forEach((word) => {
        const re = new RegExp(word, 'gi')
        filtered = filtered.replace(re, '*'.repeat(word.length))
    })
    return filtered
}

// Track online users  socketId -> { userId, username }
const onlineUsers = new Map()

// ── Socket Auth Middleware ────────────────────────────────────────────────────
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token
        if (!token) return next(new Error('Authentication error: No token'))

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.id).lean()
        if (!user) return next(new Error('Authentication error: User not found'))

        socket.userId   = String(user._id)
        socket.username = user.name
        socket.userImage = user.image || ''
        next()
    } catch (err) {
        next(new Error('Authentication error: ' + err.message))
    }
})

// ── Socket Connection ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.username} (${socket.id})`)

    onlineUsers.set(socket.id, { userId: socket.userId, username: socket.username })
    io.emit('online_count', onlineUsers.size)

    // ── Send Message ──────────────────────────────────────────────────────────
    socket.on('send_message', async (data) => {
        try {
            const rawText = (data.message || '').trim()
            if (!rawText || rawText.length > 1000) return

            const cleanText = filterProfanity(rawText)

            const saved = await chatModel.create({
                userId:    socket.userId,
                username:  socket.username,
                userImage: socket.userImage,
                message:   cleanText,
            })

            const payload = {
                _id:       String(saved._id),
                userId:    socket.userId,
                username:  socket.username,
                userImage: socket.userImage,
                message:   cleanText,
                createdAt: saved.createdAt,
            }
            io.emit('receive_message', payload)
        } catch (err) {
            console.error('send_message error:', err)
            socket.emit('error_msg', 'Failed to send message')
        }
    })

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on('typing',      () => socket.broadcast.emit('user_typing',      { username: socket.username }))
    socket.on('stop_typing', () => socket.broadcast.emit('user_stop_typing', { username: socket.username }))

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id)
        io.emit('online_count', onlineUsers.size)
        console.log(`❌ Socket disconnected: ${socket.username}`)
    })
})

// ── Start server ──────────────────────────────────────────────────────────────
httpServer.listen(port, () => console.log('Server Started on port', port))