const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
    name: { type: String, required: true }, // Full name (first and last combined)
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

module.exports = Beneficiary;
