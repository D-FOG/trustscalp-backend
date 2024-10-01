# Broker Site

## Overview

This is a broker site backend built with Express.js, MongoDB, and AWS S3. The application allows users to manage their accounts, submit support tickets with attachments, and utilize various features necessary for a broker platform. More features to be added ....

## Features

- User registration and login
- Profile update (including zip code)
- Support ticket submission with attachments
- Beneficiary management
- Password update
- Two-factor authentication (Google Authenticator)
- More coming....

## Technologies Used

- **Node.js**: JavaScript runtime for building the backend server.
- **Express**: Web framework for building APIs.
- **MongoDB**: NoSQL database for storing user data and support tickets.
- **Mongoose**: ODM for MongoDB to manage data models.
- **AWS S3**: Cloud storage for handling file uploads.
- **Multer**: Middleware for handling multipart/form-data for file uploads.
- **JSON Web Tokens (JWT)**: For user authentication.

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- AWS Account (for S3)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-github-username/trustscalp-backend.git
   cd broker-site
   ```
   > PLEASE fork before cloning

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following variables:
   ```plaintext
   MONGODB_URI=<your_mongodb_connection_string>
   AWS_ACCESS_KEY_ID=<your_aws_access_key>
   AWS_SECRET_ACCESS_KEY=<your_aws_secret_key>
   AWS_REGION=<your_aws_region>
   AWS_S3_BUCKET=<your_s3_bucket_name>
   PORT=8000  || or any other
   ```

### Running the Application

To start the server, run the following command:
```bash
npm start
```

The server will run on `http://localhost:3000` || `http://localhost:<your-PORT>`.

### API Endpoints

- **User Registration**: `POST /api/auth/signup`
- **User Login**: `POST /api/auth/login`
- **Update Profile**: `PUT /api/users/profile`
- **Update Password**: `PUT /api/users/password`
- **Submit Support Ticket**: `POST /api/support/ticket`
- **Create Beneficiary**: `POST /api/users/beneficiary`
- **Generate 2-Factor Authentication**: `POST /api/2fa/generate`
- **Verify 2-Factor Authentication**: `POST /api/2fa/verify`

### File Uploads

Users can attach files (up to 5 files) in the following formats for support ticket submissions: `.doc`, `.docx`, `.pdf`, `.jpg`, `.jpeg`, `.png`. Uploaded files will be stored in the specified AWS S3 bucket, and the URLs will be saved in MongoDB.

## Contributing

If you would like to contribute to this project, just fork it and clone on your pc and edit as much as you want 😁.

## License

This project is licensed under the MIT License.

Built with love and passion by D-FOG 😁
