const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin.model');
const dotenv = require('dotenv');

dotenv.config();

// Function to hash passwords
async function hashPassword(password) {
    const saltRounds = 10; // Adjust the cost factor as needed
    return await bcrypt.hash(password, saltRounds);
}

// Function to create the main admin
async function createMainAdmin() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI;
        console.log(mongoURI);
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const existingMainAdmin = await Admin.findOne({ role: 'mainAdmin' });
        if (!existingMainAdmin) {
            const hashedPassword = await hashPassword('mainAdmin123'); // Replace with your desired password
            const mainAdmin = new Admin({
                username: "mainadmin",
                email: 'main.admin@gmail.com',
                password: hashedPassword,
                role: 'mainAdmin',
                status: 'approved',
            });
            await mainAdmin.save();
            console.log('Main admin created successfully.');
        } else {
            console.log('Main admin already exists.');
        }
    } catch (error) {
        console.error('Error creating main admin:', error.message);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
    }
}

// Run the script
createMainAdmin();
