const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.models');

const signup = async (req, res) => {
    const { firstname, lastname, email, password, country, username, phonenumber } = req.body;

    try {
        console.log(req.body);
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User email already exists' });
        }
        // Check if user already exists
        const existingUserName = await User.findOne({ username });
        if (existingUserName) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const existingMobile = await User.findOne({ phonenumber });
        if (existingMobile) {
            return res.status(400).json({ message: 'Phone number already exists' });
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
            phonenumber,
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log({ user: { id: user._id, email: user.email }, token });

        res.status(201).json({ user: { id: user._id, email: user.email }, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', err: error });
    }
};

module.exports = { signup };
