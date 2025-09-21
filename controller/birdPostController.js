// const { spawn } = require("child_process");
const { getAllPosts, createPost, getPostById, deletePostById, getPostVotes, updateBirdPrediction, voteOnPost } = require("../models/posts");
S3 = require("@aws-sdk/client-s3");
const {s3Client} = require('../db.js')
const SQS = require("@aws-sdk/client-sqs");
const { randomUUID } = require('node:crypto');

// GET POST
exports.getAllBirdPosts= async (req, res)=>{
    //add pagination and filters etc
    const query = req.query;
    try {
        const result = await getAllPosts(query);
        return res.status(201).json(result)
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
        if (!post){
            return res.status(404)
        }
        return res.status(201).json(post);
    } catch (error){
        res.status(500).json({message: error.message});
    }
}

exports.getPostVotes = async (req, res) =>{
    try{// should add check for visibility/block TODO
        const post_id = req.params.post_id;
        const result = await getPostVotes(post_id);
        return res.status(201).json({message:"success", result}) 
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
        const img_uuid = randomUUID();

        if (!title || !image || !mimeType){
            return res.status(400).json({message:'invalid body, use form-data with 1 text field "title" and 1 file field "image"'})
        }

        if (!mimeType.startsWith("image/")){
            return res.status(400).json({message:'image must be valid image'})
        }
        //upload img to bucket
        // TODO FIX create bucket if not exists in db.js
        try{
            const response = await s3Client.send(
                new S3.PutObjectCommand({
                Bucket: process.env.BUCKET,
                Key: img_uuid,
                Body: image,
                ContentType: mimeType
                })
            );
            //REMOVE this log, it is testing only...s
            console.log(response);

        } catch (err){
            //FIX if this fails the whole thing should cancel
            console.log(err);
            return res.status(500).json({err});
        }

        console.log(img_uuid);
        // FIX TO USE .env
        const model='classifier/model.py';// FIX this stuff should be in its own file really...
        const head_weights='classifier/weights.pth'
        //const dinoV2_weights='dinov2_vits14_pretrain.pth'

        let output ="";
        let errors ="";

        // the img classification comes second, then updates afterwards
        const result= await createPost(user_id, img_uuid, title, output, 'visible');//img_uuid
        const post_id= result;
        res.status(201).json({message:'success', post_id:post_id});

        //add img to queue
        const client = new SQS.SQSClient({
            region: "ap-southeast-2",
        });
        const sqsResponse= await client.send(
            new SQS.SendMessageCommand({
                QueueUrl: process.env.SQS_URL,
                MessageBody:img_uuid
            })
        );
        console.log("Sending to SQS", sqsResponse);

        /* Old .spawn
        const birdClassifier= spawn('python3', ["-u",model,head_weights]);//,dinoV2_weights]);
        console.log(`spawning python`)
        birdClassifier.stdin.write(image);// --
        birdClassifier.stdin.end();//--

        birdClassifier.stdout.on('data', (data)=>{
            output+=data.toString();
        });
        birdClassifier.stderr.on("data", (data) => {
            errors += data.toString();
            console.error('python stderr:', data.toString());
        });
        
        //FIX potential issue, i don't think it can ever happen
        //but technically couldn't the model finish before the res
        //resulting in the update failing?
        birdClassifier.on('close', (code)=>{

            output=output.trim();
            console.log(`post:${post_id}, predicted:${output}`)
            //update prediction
            updateBirdPrediction(post_id, output)
        });
    */
        
    } catch (error) {
        res.status(500).json({message:error.message});///FIX
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

        if (!user_id || !post_id || !vote){
            return res.status(400).json({message: 'missing fields, need at least "vote" field'})
        }
        if (![-1,0,1].includes(Number(vote)) ){
            return res.status(400).json({message:'invalid value for "vote", has to be -1, 0, 1'})
        }
        // FIX, add input val, and other statuses
        return res.status(201).json({message:"success"});
    } catch (error){
        return res.status(500).json({ message:error.message})
    }
}
// DELETE POST
exports.deleteBirdPost= async (req, res)=>{
    //as always add input validation and statuses(FIX)
    try{
        const user_id = req.user_id;
        const post_id = req.params.post_id;
        const result =  await deletePostById(post_id, user_id);
        return res.status(201).json({message:'success', result});
    } catch(error){
        return res.status(501).json({ message:error})//bad FIX
    }
}