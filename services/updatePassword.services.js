const User = require('../models/user.models');
const bcrypt = require('bcryptjs');

const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const userId = req.user; // User ID from the authenticated token

        // Find the user by their ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the old password matches the current one
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Unable to update password', error: error.message });
    }
};

module.exports = { updatePassword };
