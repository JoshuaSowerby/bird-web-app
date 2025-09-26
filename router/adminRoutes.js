const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { adminDeleteBirdPost, adminDeleteComment } = require('../controller/adminController');

router.delete('/post', verifyToken, adminDeleteBirdPost)
router.delete('/comment', verifyToken, adminDeleteComment)

module.exports=router;