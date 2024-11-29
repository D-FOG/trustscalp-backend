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
const { submitPassphrase } = require('../services/user.services');
const { deposit } = require('../services/user.services');
const { depositScreenshot } = require('../services/user.services');
const { createWithdrawal } = require('../services/user.services');
const { getTotalBalance } = require('../services/user.services');
const { getTotalDepositBalance } = require('../services/user.services');
const { getTotalWithdrawalBalance } = require('../services/user.services');
const { getTotalProfits } = require('../services/user.services');

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
// Route for submitting passphrase
router.post('/submit-passphrase', auth, submitPassphrase);
router.post('/deposit', auth, deposit);
router.post('/deposit/screenshot', upload.single('screenshot'), depositScreenshot);
router.post('/withdrawals', auth, createWithdrawal); 
router.get('/user/total-balance', auth, getTotalBalance);   
router.get('/user/total-deposit', auth, getTotalDepositBalance);   
router.get('/user/total-withdrawals', auth, getTotalWithdrawalBalance);
router.get('/user/total-profits', auth, getTotalProfits);   


module.exports = router;