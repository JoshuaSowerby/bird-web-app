const Cognito = require("@aws-sdk/client-cognito-identity-provider");
const crypto = require("crypto");
const {commitUser} = require('../models/auth.js');

const clientId = process.env.COGNITO_CLIENT_ID;  // Obtain from the AWS console
const clientSecret = process.env.COGNITO_CLIENT_SECRET;  // Obtain from the AWS 
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const region = process.env.REGION;

function secretHash(clientId, clientSecret, username) {
  const hasher = crypto.createHmac('sha256', clientSecret);
  hasher.update(`${username}${clientId}`);
  return hasher.digest('base64');
}

//register
exports.registerUser = async (req, res) => {
    try {
        const {username, password, email} = req.body;
        const client = new Cognito.CognitoIdentityProviderClient({ region });
        const command = new Cognito.SignUpCommand({
            ClientId: clientId,
            SecretHash: secretHash(clientId, clientSecret, username),
            Username: username,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        });
        const cognitoRes = await client.send(command);
        res.status(200).json({message:'success'})
        //cognitoRes.UserSub should I add to db here?

    } catch (error) {
        res.status(500).json(error)
    }
};

//confirm
exports.confirmUser = async (req, res) => {
    try {
        const {username, code} = req.body;
        const client = new Cognito.CognitoIdentityProviderClient({ region });
        const command = new Cognito.ConfirmSignUpCommand({
            ClientId: clientId,
            SecretHash: secretHash(clientId, clientSecret, username),
            Username: username,
            ConfirmationCode: code,
        });
        const cognitoRes = await client.send(command);
        const sub =cognitoRes.sub;
        const usernameRes = cognitoRes["cognito:username"];//technically redundant as username hs to be correct to get here
        await commitUser(usernameRes,sub);
        res.status(200).json({message:"success"});
        //cognitoRes doesnt give anything of interest here (other than session)
    } catch (error) {
        res.status(500).json(error)
    }

};
//login, mandatory MFA email
exports.loginUser = async (req, res) => {
    try {
        const {username,password}=req.body;
        const client = new Cognito.CognitoIdentityProviderClient({ region });
        console.log("Getting auth token");
        // Get authentication tokens from the Cognito API using username and password
        const command = new Cognito.InitiateAuthCommand({
            AuthFlow: Cognito.AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
                SECRET_HASH: secretHash(clientId, clientSecret, username),
            },
            ClientId: clientId,
        });
        const cognitoRes = await client.send(command);
        console.log(cognitoRes);
        const session = cognitoRes.Session//.IdToken;
        return res.status(200).json({session})
    } catch (error) {
        res.status(500).json(error);
    }

};
//challenge, would be in res.AuthenticationResult.ChallengeParameters??
exports.challenge = async (req, res) => {
    try {
        const {username, session, code} = req.body;
        const client = new Cognito.CognitoIdentityProviderClient({ region });
        const command = new Cognito.RespondToAuthChallengeCommand({
            ClientId: clientId,
            Session: session,
            ChallengeName: 'EMAIL_OTP',//currently only allow email
            ChallengeResponses: {
                EMAIL_OTP_CODE: code,
			    SECRET_HASH: secretHash(clientId, clientSecret, username),
                USERNAME: username,
            },
        });
        const challengeRes= await client.send(command);
        res.status(200).json({token: challengeRes.AuthenticationResult.IdToken});
    } catch (error) {
        res.status(500).json(error);
    }
    
};