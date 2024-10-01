const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.models');

const signup = async (req, res) => {
    const { firstname, lastname, email, password, country, username, phonenumber } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            country,
            username,
            phonenumber
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ user: { id: user._id, email: user.email }, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};

module.exports = { signup };
