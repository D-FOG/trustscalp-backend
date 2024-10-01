const express = require('express');
const auth = require('../middleware/auth.middleware');
const { signup } = require('../services/signup.services');
const { login } = require('../services/login.services');
const { updateProfile } = require('../services/updateProfile.services');
const { addBeneficiary } = require('../services/beneficiary.services');
const { updatePassword } = require('../services/updatePassword.services');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', auth, updateProfile);
router.post('/beneficiary', auth, addBeneficiary);
router.put('/update-password', auth, updatePassword);

module.exports = router;
