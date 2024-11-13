const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.models');
const Admin = require('../models/admin.model');
const { uploadFileToS3 } = require('../utils/s3'); // Import S3 upload helper
const aws = require('aws-sdk');

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
        const existingUser = await Admin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Check if the user already exists
        const existingUserName = await Admin.findOne({ username });
        if (existingUserName) {
            return res.status(400).json({ message: 'User with this user name already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new Admin({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'Signup successful' });
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

// const updateAdminProfile = async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         console.log(name, email, password);
//         console.log(req.file)
//         const adminId = req.adminId
//         console.log(adminId);
//         // const authToken = req.headers.authorization.split(' ')[1];

//         // // Authenticate admin (you would replace this with actual auth verification)
//         // const adminId = verifyAuthToken(authToken); // Function to verify auth token and get admin ID
//         // if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

//         // Find admin in DB
//         const admin = await Admin.findById(adminId);
//         console.log(admin);
//         if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        
//         const existingEmail = await Admin.findOne({ email });

//         if (existingEmail && existingEmail._id == adminId) {
//             return res.status(400).json({ message: `The email you are trying to update is your already existing email` });
//         }

//         if (existingEmail && existingEmail._id != adminId){
//             return res.status(400).json({ message: "The email is already associated to another admin" });
//         }
        
//         // Delete existing image from S3
//         if (admin.profileImageUrl) {
//             const existingImageKey = admin.profileImageUrl.split('.com/')[1]; // Extract key from URL
//             await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: existingImageKey }).promise();
//         }

//         // Upload new image to S3 if provided
//         let newImageURL = admin.profileImageUrl; // Default to old image URL if no new image
//         let newImageName;
//         console.log(req.file)
//         if (req.file) {
//             const s3UploadResult = await uploadFileToS3(req.file);
//             newImageURL = s3UploadResult.Location; // Get new image URL from S3
//             newImageName = req.file.originalname;
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         console.log(newImageURL, newImageName);
//         // Update admin details in MongoDB
//         admin.name = name;
//         admin.email = email;
//         admin.password = hashedPassword; // In a real scenario, hash the password
//         admin.profileImageUrl = newImageURL;
//         admin.profileImageName = newImageName;

//         await admin.save();

//         return res.json({ success: true, message: 'Profile updated successfully', imageUrl: newImageURL });
//     } catch (error) {
//         console.error('Error updating profile:', error);
//         return res.status(500).json({ success: false, message: 'Error updating profile', error });
//     }
// };


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
    getAdmin
};

