const express = require('express');
const router = express.Router();
const { getAllBirdPosts, getBirdPost, voteOnBirdPost, postBirdPost, deleteBirdPost, getPostVotes } = require('../controller/birdPostController');
const { verifyToken } = require('../middleware/authMiddleware');


//may need middleware to check permissions, but can do that later
//like ....., verifyVisibility, verifyToken, get/postThing) etc
// `/bird/posts`
router.post('/', verifyToken, postBirdPost);
router.get('/', getAllBirdPosts);
// `/bird/posts/:postId`
router.get('/:post_id', getBirdPost);
router.delete('/:post_id', verifyToken, deleteBirdPost);
// `/bird/posts/:postId/vote`
router.put('/:post_id/vote', verifyToken, voteOnBirdPost);
router.get('/:post_id/vote', getPostVotes);

module.exports=router;