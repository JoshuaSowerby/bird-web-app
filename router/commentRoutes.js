const express = require('express');
const router = express.Router({mergeParams:true});
const { verifyToken } = require('../middleware/authMiddleware');
const {postComment, getAllComments, getComment, deleteComment, voteOnComment, getCommentVotes} = require('../controller/commentController');
// `/bird/:postId/comments`
router.post('/', verifyToken, postComment);
router.get('/', getAllComments);
// `/bird/:postId/comments/:commentId`
router.get('/:comment_id', getComment);
router.delete('/:comment_id', verifyToken, deleteComment);
// `/bird/:postId/comment/:commentId/vote`
router.put('/:comment_id/vote', verifyToken, voteOnComment);
router.get('/:comment_id/vote', getCommentVotes);

module.exports=router;