const Beneficiary = require('../models/beneficiary.models');

const addBeneficiary = async (req, res) => {
    const { name, address, email, mobileNumber } = req.body;

    try {
        // Check if the authenticated user is available from the token
        const userId = req.user;

        // Create new beneficiary
        const newBeneficiary = new Beneficiary({
            userId,
            name,
            address,
            email,
            mobileNumber
        });

        await newBeneficiary.save();

        res.status(201).json({ message: 'Beneficiary added successfully', beneficiary: newBeneficiary });
    } catch (error) {
        res.status(500).json({ message: 'Unable to add beneficiary', error: error.message });
    }
};

module.exports = { addBeneficiary };
