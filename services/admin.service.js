const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.models');

// Admin Signup
const signup = async (req, res) => {
    const { firstname, lastname, email, password, country, username, phonenumber, zip } = req.body;

    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin
        const newAdmin = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            country,
            username,
            phonenumber,
            zip,
            role: 'admin',  // Set role to 'admin'
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin Login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if admin exists
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();  // Fetch all users from the database
        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: err.message
        });
    }
};

// Get user count
const getUserCount = async (req, res) => {
    try {
        const count = await User.countDocuments();  // Get the total user count
        return res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve user count',
            error: err.message
        });
    }
};

module.exports = {
    signup,
    login,
    getAllUsers,
    getUserCount
};

