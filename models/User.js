const mongoose = require('mongoose');

const userModel = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    imageUrl: String,
    pushToken: String
});

const User = mongoose.model('users', userModel);

module.exports = User;