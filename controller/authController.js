
const jwt = require('jsonwebtoken');

const generateToken = (id)=>{
    return jwt.sign(
        {user_id: id}, process.env.JWT_SECRET, {expiresIn: '7d'}
    );
};


//REGISTER
exports.register = async (req, res) => {
    const {email, password, username} = req.body;
    //input val goes here
    const conn = await pool.getConnection();
    const pw_hash = await bcrypt.hash(password,12);
    try {
        const result =await conn.query(`
            INSERT INTO users (username, email, pw_hash)
            VALUES (?, ?, ?)`,[username, email, pw_hash]);
        const token = generateToken(result.insertId);
        res.status(201).json({message:'registration successful',token})
    } catch (error){
        res.status(500).json({message:error.message})
    }
    finally {
        conn.release();
    }
};


//LOGIN
exports.loginUser = async (req, res) => {
    const {email, password} = req.body;
    const conn = await pool.getConnection();
    try {
        const result = await conn.query(`
            SELECT id, pw_hash FROM users WHERE email = ?`,
            [email]);
        if (bcrypt.compare(password, result[0].pw_hash)){
            const token=generateToken(result[0].id)
            res.status(201).json({message:'login successful', token})
        } else {
            res.status(401).json({message: 'invalid credentials'})
        }
    } catch (error){
        res.status(500).json({message:error.message})
    }
    finally {
        conn.release();
    }
};


