const mongoose = require('mongoose');

const unapprovedAdminSchema = new mongoose.Schema({
    firstname: {
        type: String,
        trim: true
    },
    lastname: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        match: /.+\@.+\..+/ // Simple email validation
    },
    password: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending',
    },
    role: {
        type: String,
        enum: ['admin', 'mainAdmin'],
        default: 'admin',
    },
}, { timestamps: true });

const UnapprovedAdmin = mongoose.model('UnapprovedAdmin', unapprovedAdminSchema);

module.exports = UnapprovedAdmin;
