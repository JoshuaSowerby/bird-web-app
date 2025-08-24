const { spawn } = require("child_process");

// GET POST
exports.getAllBirdPosts= async (req, res)=>{
    //
    res.status(501).json({ message:"'getAllBirdPosts' not yet implemented"})
}

exports.getBirdPost= async (req, res)=>{
    //
    res.status(501).json({ message:"'getBirdPost' not yet implemented"})
}
// POST POST

exports.postBirdPost= async (req, res)=>{
    //
    const {img} = req.body;
    console.log(img);
    const model='model.py';
    //
    
    let output ="";
    let errors ="";
    const birdClassifier= spawn('python', ["-u",model,img]);

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
       res.status(200).json({message:output.trim()});
    });
    //console.log(output);
    //res.status(501).json({ message:"'postBirdPost' not yet implemented"})
}
// POST/UPDATE POST/VOTE 
exports.voteOnBirdPost= async (req, res)=>{
    //
    res.status(501).json({ message:"'voteOnBirdPost' not yet implemented"})
}
// DELETE POST
exports.deleteBirdPost= async (req, res)=>{
    //
    res.status(501).json({ message:"'deleteBirdPost' not yet implemented"})
}