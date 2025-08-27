


const { createComment, getCommentById, getAllComments, voteOnComment, deleteCommentById, updateCommentById, getCommentVotes } = require("../models/comments")

// GET COMMENT
exports.getAllComments= async (req, res)=>{
    // add filters and pagination FIX TODO
    //also we should filter based on blocks etc... TODO
    // additional status codes too
    try {
        const post_id =req.params.post_id;
        const result = await getAllComments(post_id);
        res.status(201).json({message:"success", result})
    } catch (error) {
        res.status(500).json({ message:error.message})
    }
}

exports.getComment= async (req, res)=>{
    //also we should filter based on blocks etc... TODO
    try {
        const comment_id =req.params.comment_id;
        const result = await getCommentById(comment_id);
        res.status(201).json({message:"success", result})
    } catch (error) {
        res.status(500).json({ message:error.message})
    }
}
exports.getCommentVotes = async (req, res) =>{
    try{// should add check for visibility/block TODO
        const comment_id = req.params.comment_id;
        const result = await getCommentVotes(comment_id);
        res.status(201).json({message:"success", result}) 
    } catch (error){
        res.status(500).json({ message:error.message})
    }
}

// POST COMMENT
exports.postComment= async (req, res)=>{
    try{
        //FIX, add input val and more status codes
        const user_id = req.user_id;
        const post_id = req.params.post_id
        console.log(post_id)
        const {parent_id, text} = req.body;
        const result = await createComment(user_id, post_id, text, parent_id)
        res.status(201).json({message:"success", comment_id:result})
    } catch(error){
        res.status(500).json({ message:error.message})
    }
}

// POST/UPDATE COMMENT/VOTE
exports.voteOnComment= async (req, res)=>{
    //
    try{
        //FIX, add input val and more status codes
        const user_id = req.user_id;
        const comment_id = req.params.comment_id;
        const {vote} = req.body;
        const result = await voteOnComment(user_id, comment_id, vote)
        res.status(201).json({message:"success", result})
    } catch(error){
        res.status(500).json({ message:error.message})
    }
}

// DELETE COMMENT
exports.deleteComment= async (req, res)=>{
    //
    try{
        //FIX, add input val and more status codes
        const user_id = req.user_id;
        const comment_id = req.params.comment_id;
        const result = await deleteCommentById(comment_id, user_id)
        res.status(201).json({message:"success", result})
    } catch(error){
        res.status(500).json({ message:error.message})
    }
}
// UPDATE COMMENT
exports.updateComment= async (req, res)=>{
    //
    try{
        //FIX, add input val and more status codes
        const user_id = req.user_id;
        const comment_id = req.params.comment_id
        const {text} = req.body;
        const result = await updateCommentById(comment_id, user_id, text)
        res.status(201).json({message:"success", comment_id:result})
    } catch(error){
        res.status(500).json({ message:error.message})
    }
}