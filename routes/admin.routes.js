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
router.get('/wallet-details', authenticateAdmin, adminRouting.getAllUsersWithWalletDetails);
router.get('/get-admin', authenticateAdmin, adminRouting.getAdmin);
router.post('/forgot-password', adminRouting.forgotPassword);
router.post('/reset-password', adminRouting.resetPassword);
router.get('/get-withdrawals', authenticateAdmin, adminRouting.getWithdrawals ); // GET /api/withdrawals
router.put('/update-withdrawal', authenticateAdmin, adminRouting.updateWithdrawal);
router.get('/get-deposits', authenticateAdmin, adminRouting.getDeposits); // GET /api/withdrawals
router.put('/update-deposits', authenticateAdmin, adminRouting.updateDeposit);
router.get('/admins', authenticateAdmin, adminRouting.getAdmins);
router.get('/unapproved-admins', authenticateAdmin, adminRouting.getUnapprovedAdmins);
router.put('/approve', authenticateAdmin, adminRouting.approveAdmin);
router.delete('/reject', authenticateAdmin, adminRouting.rejectAdmin);
router.delete('/delete', authenticateAdmin, adminRouting.deleteUserByEmail);
router.delete('/delete-passphrase', authenticateAdmin, adminRouting.deletePassPhraseByUsername);
router.post('/deposit-balance', authenticateAdmin, adminRouting.getTotalDepositBalance);
router.post('/withdrawal-balance', authenticateAdmin, adminRouting.getTotalWithdrawalBalance);
router.put('/update-balance', authenticateAdmin, adminRouting.updateUserDetails);
module.exports = router;
