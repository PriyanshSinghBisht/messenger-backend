const mongoose = require('mongoose');
const User = require('./User')

const userModel = mongoose.Schema({
    content: String,
    sendBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('messages', userModel);

module.exports = Message;