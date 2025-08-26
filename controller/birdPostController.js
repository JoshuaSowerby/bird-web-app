const { spawn } = require("child_process");
const { getAllPosts, createPost, getPostById, deletePostById, getPostVotes } = require("../models/posts");

// GET POST
exports.getAllBirdPosts= async (req, res)=>{
    //add pagination and filters etc
    try {
        const result = await getAllPosts();
        res.status(201).json(result)
    } catch (error){
        res.status(500).json({ message:error.message});
    }
}

exports.getBirdPost= async (req, res)=>{
    //
    try{
        const {post_id} = req.body;
        const post = await getPostById(post_id);
        //add no post found check check FIX
        //assess visibility TODO
        res.status(201).json(post);
    } catch (error){
        res.status(500).json({message: error.message});
    }
}

exports.getPostVotes = async (req, res) =>{
    try{// should add check for visibility/block TODO
        const {post_id} = req.body;
        const result = await getPostVotes(post_id);
        res.status(201).json({message:"success", result}) 
    } catch (error){
        res.status(500).json({ message:error.message})
    }
}
// POST POST

exports.postBirdPost= async (req, res)=>{
    //this needs to change to the actual image rather than URL...
    //!!!! FIX
    try {
        const {imgURL, title} = req.body;
        const user_id = req.user_id; 
        console.log(imgURL);
        const model='model.py';
        //
        
        let output ="";
        let errors ="";
        const birdClassifier= spawn('python', ["-u",model,imgURL]);

        birdClassifier.stdout.on('data', (data)=>{
            output+=data.toString();
        });
        birdClassifier.stderr.on("data", (data) => {
            errors += data.toString();
        });
        
        birdClassifier.on('close', (code)=>{
        //res.json({ prediction: output.trim() })
        console.log(`out:${output}`);
        console.log(`code:${code}`);
        console.log("stderr:", errors.trim());
        //res.status(200).json({message:output.trim()});
        output=output.trim();
        });
        //!!! FIX, add check for if valid..
        const result= createPost(user_id, imgURL, title, output, 'visible');
        res.status(201).json({message:'success', post_id:result});
    } catch (error) {
        res.status(500).json({message:error.message});
    }
    
};
// POST/UPDATE POST/VOTE 
exports.voteOnBirdPost= async (req, res)=>{
    //
    try{
        const user_id = req.user_id;
        const {post_id, vote} = req.body
        const result = await voteOnPost(user_id,post_id, vote)
        // FIX, add input val, and other statuses
        res.status(201).json({message:"success"});
    } catch (error){
        res.status(500).json({ message:error.message})
    }
}
// DELETE POST
exports.deleteBirdPost= async (req, res)=>{
    //as always add input validation and statuses(FIX)
    try{
        const user_id = req.user_id;
        const {post_id} = req.body;
        const result =  await deletePostById(user_id, post_id);
        res.status(201).json({message:'success', result});
    } catch(error){
        res.status(501).json({ message:"'deleteBirdPost' not yet implemented"})
    }
}