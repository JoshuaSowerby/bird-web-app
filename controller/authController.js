
const jwt = require('jsonwebtoken');
const {pool} = require('../db.js');// FIX this should be in models?
const bcrypt = require('bcrypt');

const generateToken = (id)=>{
    return jwt.sign(
        {user_id: id}, process.env.JWT_SECRET, {expiresIn: '7d'}
    );
};


//REGISTER
exports.registerUser = async (req, res) => {
    const {email, password, username} = req.body;
    //input val goes here
    if (!email, !password, !username){
        return res.status(400).json({message:'Missing fields'})
    }
    const client = await pool.connect();
    const pw_hash = await bcrypt.hash(password,12);
    const emailTaken= await client.query(`
        SELECT email FROM users WHERE email = $1`,[email])
    if (emailTaken.rows.length>0){
        return res.status(401).json({message:'email in use'})
    }
    try {
        const result =await client.query(`
            INSERT INTO users (username, email, pw_hash)
            VALUES ($1, $2, $3)
            RETURNING id`,[username, email, pw_hash]);
        const user_id = result.rows[0].id;
        const token = generateToken(user_id);
        
        return res.status(201).json({message:'registration successful',token})
    } catch (error){
        res.status(500).json({message:error.message})// FIX
    }
    finally {
        client.release();
    }
};


//LOGIN
exports.loginUser = async (req, res) => {
    const {email, password} = req.body;
    const client = await pool.connect();
    if (!email || !password){
        res.status(400).json({message:'missing fields'});
    }
    try {
        const result = await client.query(`
            SELECT id, pw_hash FROM users WHERE email = $1`,
            [email]);
        if (result.rows.length === 0){
            return res.status(401).json({message: 'invalid credentials'})
        }
        const user = result.rows[0];
        if (await bcrypt.compare(password, user.pw_hash)){
            const token=generateToken(user.id)
            return res.status(201).json({message:'login successful', token})
        } else {
            return res.status(401).json({message: 'invalid credentials'})
        }
    } catch (error){
        res.status(500).json({message:error.message})
    }
    finally {
        client.release();
    }
};


