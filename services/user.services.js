const User = require('../models/user.models');

const getUser = async (req, res) => {
    try{
        id = req.user;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with the user profile data
        res.status(200).json({ user });
    } catch (error) {
        console.error(err);
        res.status(500).json({ message: 'Server error', errMessage: err });
    }
};

module.exports = { getUser };