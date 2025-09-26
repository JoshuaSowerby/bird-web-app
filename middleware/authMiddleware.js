const Cognito = require("@aws-sdk/client-cognito-identity-provider");

// const IdTokenVerifyResult = await idVerifier.verify(IdToken)
// const sub=IdTokenVerifyResult.sub;

const jwt = require("aws-jwt-verify");

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
        const IdTokenVerifyResult = await idVerifier.verify(IdToken)
        req.sub = IdTokenVerifyResult.sub;
        req.groups = IdTokenVerifyResult["cognito:groups"];
        next();
    }catch (err){
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
};