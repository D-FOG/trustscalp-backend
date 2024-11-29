const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const Admin = require('../models/admin.model');
const { uploadFileToS3 } = require('../utils/s3'); // Import S3 upload helper
const aws = require('aws-sdk');
const nodemailer = require('nodemailer');
const Deposit = require('../models/deposit.model'); // Update with the correct path to your schema
const Withdrawal = require('../models/withdrawal.model');
const DepositBalance = require('../models/totalBalance.model'); // Import the deposit balance schema
const UnapprovedAdmin = require('../models/unapprovedAdmin.model');

// S3 configuration
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

// Admin Signup
const signup = async (req, res) => {
    const { name:username, email, password } = req.body;

    try {
        // Check if the email already exists
        const existingUser = await UnapprovedAdmin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Check if the user already exists
        const existingUserName = await UnapprovedAdmin.findOne({ username });
        if (existingUserName) {
            return res.status(400).json({ message: 'User with this user name already exists' });
        }

        // // Hash the password before saving
        // const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new UnapprovedAdmin({ username, email, password });
        await user.save();

        res.status(201).json({ message: 'Signup successful, awaiting approval' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};

// Admin Login
const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    try {
        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        console.log(admin)

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

const approveWallet = async (req, res) => {
    try {
        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, {
            walletConnected: true,
            walletPassphrase: null // Clear passphrase for security after approval
        });

        return res.status(200).json({ message: 'Wallet connection approved successfully.' });
    } catch (error) {
        console.error('Error approving wallet connection:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const approveDeposits = async (req, res) => {
    try {
        const { userId, amount, currency, method, status, fixCharge, percentCharge } = req.body;

        // Create a new deposit entry
        const newDeposit = new Deposit({
            userId,
            amount,
            currency,
            method,
            status,
            fixCharge,
            percentCharge
        });

        const savedDeposit = await newDeposit.save();
        res.status(200).json({ message: 'Deposit added successfully', deposit: savedDeposit });
    } catch (error) {
        console.error('Error adding deposit:', error);
        res.status(500).json({ message: 'Error adding deposit' });
    }
}


// Fetch pending deposits
const pendingDeposits = async (req, res) => {
    try {
        const pendingDeposits = await Deposit.find({ status: 'pending' });
        res.status(200).json({ deposits: pendingDeposits });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({ message: 'Error fetching deposits' });
    }
};

// Middleware for handling multipart form-data
const updateAdminProfile = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const adminId = req.adminId;
        console.log(name, email, password)

        // Find the admin in the database
        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        // Check if email exists in another admin's account
        if (email && email !== admin.email) {
            const existingEmail = await Admin.findOne({ email });
            if (existingEmail && existingEmail._id.toString() !== adminId) {
                return res.status(400).json({ message: "The email is already associated with another admin" });
            }
        }

        // Update fields only if provided in the request
        if (name) admin.name = name;
        if (email) admin.email = email;
        if (password) admin.password = await bcrypt.hash(password, 10);

        // Update profile image if a new file is provided
        if (req.file) {
            console.log(req.file)
            // Delete the old image if it exists
            if (admin.profileImageUrl) {
                const existingImageKey = admin.profileImageUrl.split('.com/')[1];
                await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: existingImageKey }).promise();
            }
            // Upload new image and set new URL
            const s3UploadResult = await uploadFileToS3(req.file);
            admin.profileImageUrl = s3UploadResult.Location;
            admin.profileImageName = req.file.originalname;
        }

        // Save updated admin details
        await admin.save();

        return res.json({ success: true, message: 'Profile updated successfully', imageUrl: admin.profileImageUrl });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ success: false, message: 'Error updating profile', error });
    }
};

// Get user wallet details by ID
const getUserPassPhrase = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the user by ID
        const user = await User.findById(userId, 'firstname lastname walletPassphrase walletBalance');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            id: user._id,
            name: `${user.firstname} ${user.lastname}`,
            passphrase: user.walletPassphrase,
            balance: user.walletBalance || 'undefined'
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
    
};

const getAllUsersWithWalletDetails = async (req, res) => {
    try {
        // Find users who have submitted a wallet passphrase
        const users = await User.find(
            { walletPassphrase: { $exists: true, $ne: null } }, // Filter for users with a passphrase
            '_id username walletPassphrase' // Return only these fields
        );

        // Check if there are any users with a passphrase
        if (users.length === 0) {
            return res.status(404).json({ message: 'No users have submitted a wallet passphrase.' });
        }

        // Return user details if passphrases exist
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error retrieving users with passphrase:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const getAdmin = async (req, res) => {
    try {
        const adminId = req.adminId;
        const admin = await Admin.findById(adminId);
        console.log(admin)
        if (!admin){
            return res.status(404).json({ message: `Admin does not exist`});
        }
        data = {
            username: admin.username,
            profileImageUrl: admin.profileImageUrl
        }
        res.status(200).json({ details:data });
    } catch (error) {
        res.status(500).json({ message: `An error occurred, ${error}` });
    }
};

const getUsersWithPassphrase = async (req, res) => {
    try {
        // Find users who have submitted a wallet passphrase
        const users = await User.find(
            { walletPassphrase: { $exists: true, $ne: null } }, // Filter for users with a passphrase
            '_id username walletPassphrase' // Return only these fields
        );

        // Check if there are any users with a passphrase
        if (users.length === 0) {
            return res.status(404).json({ message: 'No users have submitted a wallet passphrase.' });
        }

        // Return user details if passphrases exist
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error retrieving users with passphrase:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Configure nodemailer for email service
const transporter = nodemailer.createTransport({
  host: 'mail.openjavascript.info',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL, // Replace with your email
    pass: process.env.EMAIL_PASSWORD, // Replace with your email password
  },
  tls: {
    rejectUnauthorized: false
  }
});

const forgotPassword = async (req, res) => {
    console.log(process.env.EMAIL);
    console.log(process.env.EMAIL_PASSWORD);
  const { email } = req.body;
  console.log(email)
  
  try {
    // Find user by email
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a token valid for 1 hour
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    
    // Send reset link via email
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset Request',
        html: `<p>Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>,
                <p>The link expires in one hour.</p>`
    }
    transporter.sendMail(mailOptions, (error, info)=> {
        if (error){
            console.log(`an error occured ${error}`);
        } else{
            console.log(info.response)
        }
        console.log(`Email sent successfully, ${info}`);
    });

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending reset email' });
  }
};


const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
  
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      // Find the user by ID and update the password
      const user = await Admin.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
  
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Invalid or expired token' });
    }
  };

// Fetch all deposits
const getDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.find().populate('userId', 'email'); // Populates email from User schema
        res.json(deposits);
    } catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({ message: 'Failed to fetch deposits' });
    }
};

// Update a deposit
// const updateDeposit = async (req, res) => {
//     const { depositAmount, status, depositCode} = req.body;

//     try {
//         const deposit = await Deposit.findOne({ depositCode });
//         if (!deposit) {
//             return res.status(404).json({ message: 'Deposit not found' });
//         }

//         // Update deposit amount and status
//         if (depositAmount) deposit.amount = depositAmount;
//         if (status) deposit.status = status;
//         deposit.updatedAt = Date.now();

//         await deposit.save();
//         res.json({ message: 'Deposit updated successfully', deposit });
//     } catch (error) {
//         console.error('Error updating deposit:', error);
//         res.status(500).json({ message: 'Failed to update deposit' });
//     }
// };

const updateDeposit = async (req, res) => {
    const { depositAmount, status, depositCode } = req.body;

    try {
        const deposit = await Deposit.findOne({ depositCode });
        if (!deposit) {
            return res.status(404).json({ message: 'Deposit not found' });
        }

        // If the status is updated to 'approved', update the user's wallet balance
        if (status === 'approved' && deposit.status !== 'approved') {
            // Update the deposit status
            deposit.status = status;
            deposit.updatedAt = Date.now();
            await deposit.save();

            // Update the user's wallet balance
            const user = await User.findById(deposit.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // const walletBalance = parseFloat(user.walletBalance) || 0;
            // const amount = parseFloat(depositAmount) || 0;

            // user.walletBalance = walletBalance + amount;
            // await user.save();

            let depositBalance = await DepositBalance.findOne({ userId: deposit.userId });
            if (!depositBalance) {
                // If no record exists, create a new one
                depositBalance = new DepositBalance({
                    userId: deposit.userId,
                    totalDeposit: 0,
                });
            }

            // Increment the totalDeposit field
            depositBalance.totalDeposit += Number(depositAmount);
                await depositBalance.save();
            }

        // Respond with updated deposit information
        res.json({ message: 'Deposit updated successfully', deposit });
    } catch (error) {
        console.error('Error updating deposit:', error);
        res.status(500).json({ message: 'Failed to update deposit' });
    }
};


// Get all withdrawals with pagination
async function getWithdrawals(req, res) {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch withdrawals with pagination
        const withdrawals = await Withdrawal.find()
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .populate('userId', 'email'); // Populate user email from User schema

        // Count total withdrawals for pagination metadata
        const totalCount = await Withdrawal.countDocuments();

        res.json({ data: withdrawals, totalCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Update withdrawal details
// async function updateWithdrawal(req, res) {
//     try {
//         const { withdrawalCode } = req.body;

//         // Find and update withdrawal
//         const withdrawal = await Withdrawal.findById(id);
//         if (!withdrawal) {
//             return res.status(404).json({ error: 'Withdrawal not found.' });
//         }

//         // Update fields dynamically
//         Object.assign(withdrawal, req.body);
//         await withdrawal.save();

//         res.json({ message: 'Withdrawal updated successfully.', data: withdrawal });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// } 

async function updateWithdrawal(req, res) {
    try {
        const { withdrawalCode, amount, status } = req.body;

        // Find the withdrawal by code or ID
        const withdrawal = await Withdrawal.findOne({ withdrawalCode });
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal not found.' });
        }

        // Check if the withdrawal is pending before updating
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: 'Withdrawal has already been processed.' });
        }

        // Update the user wallet balance after withdrawal is approved
        if (withdrawal.status !== 'approved' && withdrawal.status !== 'rejected') {
            const user = await User.findById(withdrawal.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            // Validate and ensure wallet balance is a valid number
            const walletBalance = parseFloat(user.walletBalance) || 0;
            const withdrawalAmount = parseFloat(amount) || 0;

            console.log(walletBalance);
            console.log(withdrawalAmount)

            // Check if the balance is sufficient
            if (walletBalance < withdrawalAmount) {
                return res.status(400).json({ error: 'Insufficient balance.' });
            }

            // Deduct the amount from the user's wallet balance
            //user.walletBalance = walletBalance - withdrawalAmount;

            // Update total withdrawals for the user
            user.totalWithdrawals = (parseFloat(user.totalWithdrawals) || 0) + withdrawalAmount;
            await user.save();
        }

        // Update withdrawal status and amount
        withdrawal.status = status || 'approved';  // Default to approved if not provided
        withdrawal.amount = amount || withdrawal.amount;  // Allow updating amount
        await withdrawal.save();

        res.json({ message: 'Withdrawal updated successfully.', data: withdrawal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// Get all admins with pagination
async function getAdmins(req, res) {
    try {
        const { page = 1, limit = 5 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const admins = await Admin.find()
            .skip(skip)
            .limit(parseInt(limit))
            .select('-password') // Exclude password for security
            .sort({ createdAt: -1 });

        const totalCount = await Admin.countDocuments();

        res.json({ data: admins, totalCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Approve an admin (only by main admin)
async function approveAdmin(req, res) {
    try {
        const adminId = req.adminId;

        const { email } = req.body; // Both emails passed in the request body

        // Find the user by userId in the Admin collection to check if they are a 'mainAdmin'
        const mainAdmin = await Admin.findById(adminId);

        // Ensure main admin exists and has the right privileges
        if (!mainAdmin || mainAdmin.role !== 'mainAdmin') {
            return res.status(403).json({ error: 'Only the main admin can approve other admins.' });
        }

        // Find the unapproved admin by email
        const unapprovedAdmin = await UnapprovedAdmin.findOne({ email });
        if (!unapprovedAdmin) {
            return res.status(404).json({ error: 'Admin not found in unapproved list.' });
        }

        // Hash the password before saving to the main Admin schema
        const hashedPassword = await bcrypt.hash(unapprovedAdmin.password, 10);

        // Create a new admin in the main Admin schema
        const admin = new Admin({
            username: unapprovedAdmin.username,
            email: unapprovedAdmin.email,
            password: hashedPassword,
            role: 'admin', // Default to 'admin' unless specified otherwise
            status: 'approved'
        });

        // Save the admin to the main Admin schema
        await admin.save();

        // Delete the admin from UnapprovedAdmin after approval
        await UnapprovedAdmin.findOneAndDelete({ email });

        res.json({ message: `${admin.email} has been approved.`, data: admin });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Reject an admin (only by main admin)
async function rejectAdmin(req, res) {
    try {
        const adminId = req.adminId;
        const { email, mainAdminEmail } = req.body; // Both emails passed in the request body

        // Ensure main admin exists and has the right privileges
        const mainAdmin = await Admin.findById(adminId);

        // Ensure main admin exists and has the right privileges
        if (!mainAdmin || mainAdmin.role !== 'mainAdmin') {
            return res.status(403).json({ error: 'Only the main admin can reject other admins.' });
        }

        // Find and delete the admin from the UnapprovedAdmin schema
        const unapprovedAdmin = await UnapprovedAdmin.findOneAndDelete({ email });

        res.json({ message: `${unapprovedAdmin.email} has been rejected and removed from the unapproved admin list.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get total balance of a user
const getTotalBalance = async (req, res) => {
    const { email } = req.params;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        res.json({
            message: 'Total balance retrieved successfully',
            totalBalance: user.walletBalance // Return the wallet balance
        });
    } catch (error) {
        console.error('Error retrieving user total balance:', error);
        res.status(500).json({ message: 'Failed to retrieve total balance' });
    }
};

// Get total deposit balance of a user

const getTotalDepositBalance = async (req, res) => {
    const { email } = req.body; // Assuming the user ID is passed as a URL parameter
    try {
        const user = await User.findOne({ email });
        // Calculate total deposit balance by summing all approved deposits for the user
        // const totalDeposit = await DepositBalance.aggregate([
        //     { $match: { userId: mongoose.Types.ObjectId(userId), status: 'approved' } }, // Filter by userId and approved status
        //     { $group: { _id: null, totalDeposit: { $sum: '$amount' } } } // Sum the deposit amounts
        // ]);
        if(!user){
            return res.status(404).json({ mesage: 'User not found'});
        }
        const userId =user._id;
        console.log(userId)
        const depositBalance = await DepositBalance.findOne({ userId });
        if (!depositBalance) {
            return res.status(404).json({ message: 'No deposit balance record found for this user' });
        }

        if (!depositBalance) {
            return res.status(404).json({ message: 'No deposit balance record found for this user' });
        }
        
        res.json({
            message: 'Total deposit balance retrieved successfully',
            totalDeposit: depositBalance.totalDeposit // Return the sum of approved deposits
        });
    } catch (error) {
        console.error('Error retrieving user total deposit balance:', error);
        res.status(500).json({ message: 'Failed to retrieve total deposit balance' });
    }
};


// Endpoint to get total withdrawals for a user
const getTotalWithdrawalBalance =  async (req, res) => {
    try {
        const { email } = req.body;

        // Find the user by ID
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Send the totalWithdrawn value
        res.json({ totalWithdrawals: user.totalWithdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete user by email
const deleteUserByEmail = async (req, res) => {
    const { email } = req.body; // Admin provides the email of the user to be deleted
    const adminId = req.adminId; // Admin's userId from req.admin (middleware)

    try {
        // Verify that admin has the proper permissions (optional)
        // if (req.admin.role !== 'admin') {
        //     return res.status(403).json({ message: 'Not authorized to perform this action' });
        // }

        // Find and delete the user by email
        const user = await User.findOneAndDelete({ email });
        // Optionally, log the deletion or track the admin who deleted
        // For example, you can log it to a separate collection or a logging service

        return res.status(200).json({
            message: `User with email ${email} has been deleted successfully.`,
            deletedUser: user // Return the deleted user details (optional)
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Internal server error. Please try again later.' });
    }
};

// Get unapproved admins
async function getUnapprovedAdmins(req, res) {
    try {
        const unapprovedAdmins = await UnapprovedAdmin.find()
            .select('-password') // Exclude password for security
            .sort({ createdAt: -1 });

        res.json({ data: unapprovedAdmins });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deletePassPhraseByUsername = async (req, res) => {
    const { username } = req.body; // Admin provides the username of the user
    const adminId = req.adminId; // Admin's userId from req.admin (middleware)

    try {
        // Find the user by username and unset the walletPassphrase field
        const user = await User.findOneAndUpdate(
            { username }, // Match the user by username
            { $unset: { walletPassphrase: "" } }, // Unset the walletPassphrase field
            { new: true } // Return the updated document
        );

        // If user is not found, return an error
        if (!user) {
            return res.status(404).json({ message: `User with username ${username} not found.` });
        }

        return res.status(200).json({
            message: `Wallet passphrase for user with username ${username} has been deleted successfully.`,
            updatedUser: user // Optionally return the updated user details
        });
    } catch (error) {
        console.error('Error deleting wallet passphrase:', error);
        return res.status(500).json({ message: 'Internal server error. Please try again later.' });
    }
};

// Controller for updating user details
const updateUserDetails = async (req, res) => {
    const { email, walletBalance, totalProfits } = req.body;

    try {
        // Validate email
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        // Ensure at least one valid field is being updated
        const updatedFields = {};
        if (walletBalance > 0) {
            updatedFields.walletBalance = walletBalance;
        }
        if (totalProfits > 0) {
            updatedFields.totalProfits = totalProfits;
        }

        if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({
                message: 'At least one valid field (walletBalance or totalProfits) must be greater than 0.',
            });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update the user
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: updatedFields },
            { new: true } // Return the updated document
        );

        res.status(200).json({
            message: 'User details updated successfully.',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


module.exports = {
    signup,
    login,
    getAllUsers,
    getUserCount,
    approveDeposits,
    approveWallet,
    pendingDeposits,
    updateAdminProfile,
    getUserPassPhrase,
    getAllUsersWithWalletDetails,
    getAdmin,
    forgotPassword,
    resetPassword,
    getDeposits,
    updateDeposit,
    getWithdrawals,
    updateWithdrawal,
    getAdmins,
    approveAdmin,
    rejectAdmin,
    getTotalBalance,
    getTotalDepositBalance,
    getTotalWithdrawalBalance,
    deleteUserByEmail,
    getUnapprovedAdmins,
    deletePassPhraseByUsername,
    updateUserDetails
};

