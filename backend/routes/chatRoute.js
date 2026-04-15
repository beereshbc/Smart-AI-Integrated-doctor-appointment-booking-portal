import express from 'express'
import chatModel from '../models/chatModel.js'
import authUser from '../middlewares/authUser.js'
import userModel from '../models/userModel.js'

const chatRouter = express.Router()

// GET /api/chat/history  – fetch last 100 messages (oldest first)
chatRouter.get('/history', authUser, async (req, res) => {
    try {
        const messages = await chatModel
            .find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean()

        // Return in chronological order (oldest first)
        res.json({ success: true, messages: messages.reverse() })
    } catch (error) {
        console.error('Chat history error:', error)
        res.json({ success: false, message: error.message })
    }
})

export default chatRouter
