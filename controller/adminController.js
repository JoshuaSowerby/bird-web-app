const {adminDeleteBirdPost} = require("../models/posts");
exports.adminDeleteComment= async (req, res)=>{
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

exports.adminDeleteBirdPost= async (req, res)=>{
    //as always add input validation and statuses(FIX)
    try{
        if (req.groups.includes("Admin")){
            const result =  await deletePostById(post_id, user_id);
        }

        
        return res.status(201).json({message:'success', result});
    } catch(error){
        return res.status(501).json({ message:error})//bad FIX
    }
}