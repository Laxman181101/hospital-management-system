const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderModel: {
        type: String,
        enum: ['Doctor', 'Patient'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'document'],
        default: 'text'
    },
    content: {
        type: String, // Text message or file URL
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
