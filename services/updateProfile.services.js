const User = require('../models/user.models');
const { uploadFileToS3 } = require('../utils/s3');

const updateProfile = async (req, res) => {
    const { firstname, lastname, email, country, username, phonenumber, zip, address, state, city } = req.body;

    try {
        // Find the user by ID (which was set by the auth middleware)
        const userId = req.user;
        const updatedData = { firstname, lastname, email, country, username, phonenumber, zip, address, state, city };

        console.log(req.file);
        if (req.file) {
            // Upload the file to S3
            const s3Result = await uploadFileToS3(req.file);
            console.log(s3Result.Location, req.file.originalname);
            // Add image URL and name to the update data
            updatedData.profileImageUrl = s3Result.Location; // S3 URL
            updatedData.profileImageName = req.file.originalname; // Original file name
        }
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
