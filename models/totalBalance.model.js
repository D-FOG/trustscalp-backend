const mongoose = require('mongoose');

const depositBalanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalDeposit: { type: Number, default: 0 },
}, { timestamps: true });

const DepositBalance = mongoose.model('DepositBalance', depositBalanceSchema);

module.exports = DepositBalance;
