const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/user.models');

// Generate a 2FA Secret
const generate2FASecret = async (req, res) => {
    try {
        // Generate a secret for the user
        const secret = speakeasy.generateSecret({ name: 'YourAppName' });

        // Send the secret to the frontend to display as a QR code
        const userId = req.user; // Get user ID from auth middleware
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Save the base32 secret to the user’s account (you should save this in the DB)
        user.twoFactorSecret = secret.base32;
        await user.save();

        // Generate the QR code for the secret
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            message: '2FA setup successful',
            qrCode, // Send this to the frontend to display
            secret: secret.base32 // You might not want to expose the secret in production
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating 2FA secret', error: error.message });
    }
};

// Verify the TOTP Token
const verify2FAToken = async (req, res) => {
    const { token } = req.body;

    try {
        const userId = req.user;
        const user = await User.findById(userId);

        if (!user || !user.twoFactorSecret) {
            return res.status(404).json({ message: '2FA is not set up for this user' });
        }

        // Verify the TOTP token using the stored secret
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            res.status(200).json({ message: '2FA token verified successfully' });
        } else {
            res.status(400).json({ message: 'Invalid 2FA token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying 2FA token', error: error.message });
    }
};

module.exports = { generate2FASecret, verify2FAToken };
