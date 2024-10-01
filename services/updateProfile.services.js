const User = require('../models/user.models');

const updateProfile = async (req, res) => {
    const { firstname, lastname, country, username, phonenumber, zip } = req.body;

    try {
        // Find the user by ID (which was set by the auth middleware)
        const userId = req.user;
        const updatedData = { firstname, lastname, country, username, phonenumber, zip };

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};

module.exports = { updateProfile };
