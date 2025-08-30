
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
    const conn = await pool.getConnection();
    const pw_hash = await bcrypt.hash(password,12);
    try {
        const result =await conn.query(`
            INSERT INTO users (username, email, pw_hash)
            VALUES (?, ?, ?)`,[username, email, pw_hash]);
        const user_id = Number(result.insertId);
        const token = generateToken(user_id);
        
        return res.status(201).json({message:'registration successful',token})
    } catch (error){
        res.status(500).json({message:error.message})// FIX
    }
    finally {
        conn.release();
    }
};


//LOGIN
exports.loginUser = async (req, res) => {
    const {email, password} = req.body;
    const conn = await pool.getConnection();
    if (!email || !password){
        res.status(400).json({message:'missing fields'});
    }
    try {
        const result = await conn.query(`
            SELECT id, pw_hash FROM users WHERE email = ?`,
            [email]);
        if (await bcrypt.compare(password, result[0].pw_hash)){
            const token=generateToken(result[0].id)
            return res.status(201).json({message:'login successful', token})
        } else {
            return res.status(401).json({message: 'invalid credentials'})
        }
    } catch (error){
        res.status(500).json({message:error.message})
    }
    finally {
        conn.release();
    }
};


