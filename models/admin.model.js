const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    firstname: {
        type: String,
        trim: true
    },
    lastname: {
        type: String,
        trim: true
    },
    name:{
        type: String,
    },
    email: {
        type: String,
        unique: true,
        match: /.+\@.+\..+/ // Simple email validation
    },
    password: {
        type: String,
    },
    username: {
        type: String,
        unique: true
    },
    phonenumber: {
        type: String
    },
    country: {
        type: String
    },
    zip: {
        type: String,
    },
    address: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    profileImageUrl: {
        type: String, // URL to the image stored in S3
    },
    profileImageName: {
        type: String, // Original file name for reference
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
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


const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;