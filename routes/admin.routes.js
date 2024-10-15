const express = require('express');
const { signup, login } = require('../services/admin.service');
const router = express.Router();
const { getAllUsers, getUserCount } = require('../services/admin.service');
const authenticateAdmin = require('../middleware/adminAuth.middleware'); // Assume you have middleware for admin auth


// Admin Signup
router.post('/signup', signup);

// Admin Login
router.post('/login', login);

// Get all users
router.get('/users', authenticateAdmin, getAllUsers);

// Get user count
router.get('/users/count', authenticateAdmin, getUserCount);


module.exports = router;
