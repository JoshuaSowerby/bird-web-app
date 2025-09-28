exports.adminDeleteComment= async (req, res)=>{
    //
    try{
        //FIX, add input val and more status codes
        const groups = req.groups || [];
        if (!groups.includes("Admin")) {
            return res.status(403).json({ message: "Not authorized" });
        }
        const {user_id, comment_id} = req.body;
        const result = await deleteCommentById(comment_id, user_id)
        return res.status(201).json({message:"success", result})
    } catch(error){
        return res.status(500).json(error)//bad FIX
    }
}

exports.adminDeleteBirdPost= async (req, res)=>{
    try{
        const groups = req.groups || [];
        if (!groups.includes("Admin")) {
            return res.status(403).json({ message: "Not authorized" });
        }
        const {user_id, post_id} = req.body;
        const result =  await deletePostById(post_id, user_id);
        return res.status(201).json({message:'success', result});
    } catch(error){
        return res.status(500).json(error)//bad FIX
    }
}