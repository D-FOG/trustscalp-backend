const Ticket = require('../models/support.models');
const { uploadFileToS3 }= require('../utils/s3');

// Create a new ticket
exports.createTicket = async (req, res, io) => {
    try {
        const { subject, message } = req.body;
        let attachments = [];

        // Upload each file to S3 and collect the URLs
        if (req.files) {
            for (const file of req.files) {
                const result = await uploadFileToS3(file);
                attachments.push(result.Location); // Store the S3 URL
            }
        }

        // Create the ticket object (including S3 URLs for the attachments)
        const newTicket = new Ticket({
            user: req.userId,
            subject,
            messages: [{ sender: 'User', message, attachments }],
        });

        await newTicket.save();

        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Error creating ticket', error);
        res.status(500).json({ message: 'Error creating ticket', error });
    }
};
