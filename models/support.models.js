const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    status: { type: String, default: 'Open' },
    lastReply: { type: Date, default: Date.now },
    messages: [
        {
            sender: { type: String, required: true }, // 'User' or 'Admin'
            message: { type: String, required: true },
            attachments: [{ type: String }], // URLs of uploaded attachments
            sentAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
