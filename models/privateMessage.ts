import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PrivateMessage = new Schema({
    chatID: {
        type: String,
        required: true,
    },

    authorID: {
        type: String,
        required: true,
    },

    recipientID: {
        type: String,
        required: true,
    },

    messageID: {
        type: String,
        unique: true
    },

    content: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Number,
        required: true
    }
});

export default mongoose.model('Private Message', PrivateMessage, 'private messages');
