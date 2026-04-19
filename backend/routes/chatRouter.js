import express from "express"
import { getChatHistory, getDoctorChatList, getPatientChatList, debugMessages } from "../controllers/chatController.js"
import authDoctor from "../middlewares/authDoctor.js"
import authUser from "../middlewares/authUser.js"

const chatRouter = express.Router()

// Patient routes
chatRouter.post('/patient/chat-history', authUser, getChatHistory)
chatRouter.post('/patient/chat-list', authUser, getPatientChatList)

// Doctor routes  
chatRouter.post('/doctor/chat-history', authDoctor, getChatHistory)
chatRouter.post('/doctor/chat-list', authDoctor, getDoctorChatList)

// Debug route
chatRouter.post('/debug-messages', authUser, debugMessages)

export default chatRouter