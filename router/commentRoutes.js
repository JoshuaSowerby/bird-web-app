const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {postComment, getAllComments, getComment, deleteComment, voteOnComment} = require('../controller/commentController');
// `/bird/:postId/comments`
router.post('/bird/:postId/comments', verifyToken, postComment);
router.get('/bird/:postId/comments', getAllComments);
// `/bird/:postId/comments/:commentId`
router.get('/bird/:postId/comments/:commentId', getComment);
router.delete('/bird/:postId/comments/:commentId', verifyToken, deleteComment);
// `/bird/:postId/comment/:commentId/vote`
router.put('/bird/:postId/comments/:commentId/vote', verifyToken, voteOnComment);

module.exports=router;