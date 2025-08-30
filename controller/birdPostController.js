const { spawn } = require("child_process");
const { getAllPosts, createPost, getPostById, deletePostById, getPostVotes, updateBirdPrediction, voteOnPost } = require("../models/posts");
S3 = require("@aws-sdk/client-s3");
const {s3Client} = require('../db.js')
const { randomUUID } = require('node:crypto');

// GET POST
exports.getAllBirdPosts= async (req, res)=>{
    //add pagination and filters etc
    const query = req.query;
    try {
        const result = await getAllPosts(query);
        res.status(201).json(result)
    } catch (error){
        res.status(500).json({ message:error.message});
    }
}

exports.getBirdPost= async (req, res)=>{
    //
    try{
        const post_id = req.params.post_id;
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
        const post_id = req.params.post_id;
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
        const {title} = req.body;
        const image = req.file.buffer//---Ai
        const mimeType = req.file.mimetype;//--Ai
        const user_id = req.user_id; 
        const imgUUID = randomUUID();

        //upload img to bucket
        // TODO FIX create bucket if not exists in db.js
        try{
            const response = await s3Client.send(
                new S3.PutObjectCommand({
                Bucket: process.env.BUCKET,
                Key: imgUUID,
                Body: image,
                ContentType: mimeType
                })
            );
            //REMOVE this log, it is testing only...s
            console.log(response);

        } catch (err){
            //FIX if this fails the whole thing should cancel
            console.log(err);
            res.status(500).json({err});
            return //think this will early exit
        }

        console.log(imgUUID);
        // FIX TO USE .env
        const model='model.py';// FIX this stuff should be in its own file really...
        const head_weights='weights.pth'
        const dinoV2_weights='dinov2_vits14_pretrain.pth'

        let output ="";
        let errors ="";

        // the img classification comes second, then updates afterwards
        const result= await createPost(user_id, imgUUID, title, output, 'visible');//imgUUID
        const post_id= result;
        res.status(201).json({message:'success', post_id:result});

        const birdClassifier= spawn('python', ["-u",model,head_weights,dinoV2_weights]);

        birdClassifier.stdin.write(req.file.buffer);// --
        birdClassifier.stdin.end();//--

        birdClassifier.stdout.on('data', (data)=>{
            output+=data.toString();
        });
        birdClassifier.stderr.on("data", (data) => {
            errors += data.toString();
        });
        
        /*FIX potential issue, i don't think it can ever happen
         *but technically couldn't the model finish before the res
         *resulting in the update failing?
         */
        birdClassifier.on('close', (code)=>{
            //hide this stuff, irrelevant error messages "xFormers is not available" doesn't matter
            //res.json({ prediction: output.trim() })
            // console.log(`out:${output}`);
            // console.log(`code:${code}`);
            // console.log("stderr:", errors.trim());
            //res.status(200).json({message:output.trim()});
            output=output.trim();
            console.log(output)
            //update prediction
            updateBirdPrediction(post_id, output)
        });
        //!!! FIX, add check for if valid..
        
    } catch (error) {
        res.status(500).json({message:error.message});
    }
    
};
// POST/UPDATE POST/VOTE 
exports.voteOnBirdPost= async (req, res)=>{
    //
    try{
        const user_id = req.user_id;
        const post_id = req.params.post_id;
        const {vote} = req.body
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
        const post_id = req.params.post_id;
        const result =  await deletePostById(post_id, user_id);
        res.status(201).json({message:'success', result});
    } catch(error){
        res.status(501).json({ message:"'deleteBirdPost' not yet implemented"})
    }
}