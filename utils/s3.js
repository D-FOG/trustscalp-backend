const aws = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const multer = require('multer');


// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/';
        // Check if the uploads directory exists, and create it if not
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath); // Save files to the uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // File name saved locally
    }
});

// File filter (optional), to restrict certain file types
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb('Error: Only images and documents are allowed!');
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max file size 10MB
    fileFilter: fileFilter
});

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

const uploadFileToS3 = (file) => {
    const fileStream = fs.createReadStream(file.path);

    const params = {
        Bucket: process.env.S3_BUCKET_NAME, // Your bucket name
        Key: `uploads/${Date.now()}-${path.basename(file.originalname)}`, // S3 file name
        Body: fileStream,
        ContentType: file.mimetype,
        //ACL: 'public-read' // Make it publicly readable if needed
    };

    return s3.upload(params).promise(); // Return a promise
};

module.exports = { uploadFileToS3, upload };
