const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the User schema
        amount: { type: Number, required: true, min: 0 }, // Withdrawal amount
        walletAddress: { type: String, required: true }, // Wallet address
        currencyName: { type: String, required: true},
        withdrawalCode: { type: String },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // Request status
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
