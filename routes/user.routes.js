const express = require('express');
const auth = require('../middleware/auth.middleware');
const { signup } = require('../services/signup.services');
const { login } = require('../services/login.services');
const { updateProfile } = require('../services/updateProfile.services');
const { addBeneficiary } = require('../services/beneficiary.services');
const { updatePassword } = require('../services/updatePassword.services');
const { generate2FASecret, verify2FAToken } = require('../services/2f4.services');
const { upload }= require('../utils/s3');
const { createTicket }  = require('../services/ticket.service');
const { getUser } = require('../services/user.services');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', auth, upload.single('image'), updateProfile);
router.post('/beneficiary', auth, addBeneficiary);
router.put('/update-password', auth, updatePassword);
router.post('/2fa/generate', auth, generate2FASecret);
router.post('/2fa/verify', auth, verify2FAToken);
router.post('/tickets', auth, upload.array('attachments', 5), createTicket);
router.get('/getUser', auth, getUser);


module.exports = router;