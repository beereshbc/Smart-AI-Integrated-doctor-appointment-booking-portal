import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        userImage: {
            type: String,
            default: '',
        },
        message: {
            type: String,
            required: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }   // gives us createdAt + updatedAt automatically
)

// Index so we can efficiently fetch recent messages sorted by time
chatMessageSchema.index({ createdAt: -1 })

const chatModel =
    mongoose.models.chatmessage ||
    mongoose.model('chatmessage', chatMessageSchema)

export default chatModel
