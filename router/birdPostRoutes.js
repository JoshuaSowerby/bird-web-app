const express = require('express');
const router = express.Router();
const { getAllBirdPosts, getBirdPost, voteOnBirdPost, postBirdPost, deleteBirdPost } = require('../controller/birdPostController');
const { verifyToken } = require('../middleware/authMiddleware');

// `/bird`
router.post('/bird', verifyToken, postBirdPost);
router.get('/bird', getAllBirdPosts);
// `/bird/:postId`
router.get('/bird/:postId', getBirdPost);
router.delete('/bird/:postId', verifyToken, deleteBirdPost);
// `/bird/:postId/vote`
router.put('/bird/:postId/vote', verifyToken, voteOnBirdPost);

module.exports=router;