const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {postComment, getAllComments, getComment, deleteComment, voteOnComment, getCommentVotes} = require('../controller/commentController');
// `/bird/:postId/comments`
router.post('/', verifyToken, postComment);
router.get('/', getAllComments);
// `/bird/:postId/comments/:commentId`
router.get('/:commentId', getComment);
router.delete('/:commentId', verifyToken, deleteComment);
// `/bird/:postId/comment/:commentId/vote`
router.put('/:commentId/vote', verifyToken, voteOnComment);
router.get('/:commentId/vote', getCommentVotes);

module.exports=router;