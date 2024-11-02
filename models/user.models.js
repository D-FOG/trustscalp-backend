const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    phonenumber: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    role: { type: String},
    zip: { type: String },
    address: { type: String },
    state: { type: String },
    city: { type: String },
    twoFactorSecret: { type: String },
    profileImageUrl: { type: String },  // Added field for image URL
    profileImageName: { type: String },  // Added field for image name
    walletPassphrase: { type: String }, // For storing passphrase temporarily
    walletConnected: { type: Boolean, default: false }, // Tracks connection status
    walletBalance: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
