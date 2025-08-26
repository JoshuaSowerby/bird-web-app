const jwt = require('jsonwebtoken');


exports.verifyToken = async (req, res, next) =>{
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message: 'Access denied, no token provided'});
    }
    const token = authHeader.split(' ')[1];

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user_id = decode.user_id;
        next();
    }catch (err){
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
};