const Cognito = require("@aws-sdk/client-cognito-identity-provider");

// const IdTokenVerifyResult = await idVerifier.verify(IdToken)
// const sub=IdTokenVerifyResult.sub;

const jwt = require("aws-jwt-verify");
const { userIdFromSub } = require("../models/auth");
const memcached = require('../utils/cache.js');

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

const idVerifier = jwt.CognitoJwtVerifier.create({
  userPoolId: userPoolId,
  tokenUse: "id",
  clientId: clientId,
});

exports.verifyToken = async (req, res, next) =>{
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message: 'Access denied, no token provided'});
    }
    const IdToken = authHeader.split(' ')[1];

    try {
        //TO FIX, should hve memcache be try catch, so if down we just use db.
        const IdTokenVerifyResult = await idVerifier.verify(IdToken)
        //req.sub = IdTokenVerifyResult.sub;
        const sub=IdTokenVerifyResult.sub;
        //cached id from sub
        //try cache
        const cacheKey= `user:${sub}`;
        console.log("try cache userIdFromSub")
        const value = await memcached.aGet(cacheKey);
        if (value) {
            console.log(`cached result for ${cacheKey}`);
            req.user_id=value
        } else {
            console.log(`no cached for ${cacheKey}`);
             req.user_id= await userIdFromSub(sub);
            // Cache the data with TTL of 600 seconds
            await memcached.aSet(cacheKey, req.user_id, 600);           
        }
        //no cache
        
        req.groups = IdTokenVerifyResult["cognito:groups"];
        next();
    }catch (err){
        console.log(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
};