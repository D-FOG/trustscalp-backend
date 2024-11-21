const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { 
        id: { type: Number, required: true }, // ID of the payment method (e.g., 20)
        name: { type: String, required: true }, // Name of the payment method (e.g., 'Polygon (MATIC)')
        currency: { type: String, required: true }, // Currency for the payment (e.g., 'MATIC')
    },
    depositCode: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    screenshotUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;
