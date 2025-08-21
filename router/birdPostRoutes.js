const express = require('express');
const router = express.Router();
const { getAllBirdPosts, getBirdPost, voteOnBirdPost, postBirdPost, deleteBirdPost } = require('../controller/birdPostController');
const { verifyToken } = require('../middleware/authMiddleware');

// `/bird/posts`
router.post('/', verifyToken, postBirdPost);
router.get('/', getAllBirdPosts);
// `/bird/posts/:postId`
router.get('/:postId', getBirdPost);
router.delete('/:postId', verifyToken, deleteBirdPost);
// `/bird/posts/:postId/vote`
router.put('/:postId/vote', verifyToken, voteOnBirdPost);

module.exports=router;