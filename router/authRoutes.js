const express = require('express');
const router = express.Router();
const {registerUser, loginUser, confirmUser, challenge} = require('../controller/authController');

router.post('/register', registerUser);
router.post('/confirm', confirmUser);
router.post('/login',loginUser);
router.post('/challenge',challenge);

module.exports = router;