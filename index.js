require('dotenv').config();
const express = require('express');
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const ssm = new SSMClient({ region: process.env.REGION });
const secretsManager = new SecretsManagerClient({ region: process.env.REGION });
async function loadConfig() {
    //load param store
    let param;
    //app
    console.log("/n11775556/WEB_APP_PORT")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/WEB_APP_PORT" }));
    process.env.WEB_APP_PORT=param.Parameter.Value;

    //rds
    console.log("DB_HOST")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/DB_HOST" }));
    process.env.DB_HOST=param.Parameter.Value;
    console.log("DB_PORT")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/DB_PORT" }));
    process.env.DB_PORT=param.Parameter.Value;

    //s3
    console.log("BUCKET")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/BUCKET" }));
    process.env.BUCKET=param.Parameter.Value;
    console.log("PURPOSE")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/PURPOSE" }));
    process.env.PURPOSE=param.Parameter.Value;
    //cognito
    console.log("COGNITO_CLIENT_ID")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/COGNITO_CLIENT_ID" }));
    process.env.COGNITO_CLIENT_ID=param.Parameter.Value;
    console.log("COGNITO_USER_POOL_ID")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/COGNITO_USER_POOL_ID" }));
    process.env.COGNITO_USER_POOL_ID=param.Parameter.Value;
    //aws
    // /n11775556/QUT_USERNAME
    // /n11775556/REGION
    //sqs
    console.log("/n11775556/SQS_URL")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/SQS_URL" }));
    process.env.SQS_URL=param.Parameter.Value;
    //secret manager
    console.log("SECRET_MANAGER")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/SECRET_MANAGER" }));
    process.env.SECRET_MANAGER=param.Parameter.Value;
    //memcache
    console.log("MEM_CACHE_ADDRESS")
    param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/MEM_CACHE_ADDRESS" }));
    process.env.MEM_CACHE_ADDRESS=param.Parameter.Value;

    //load secret manager
    console.log("loading secrets")
    const secretResponse = await secretsManager.send(
        new GetSecretValueCommand({ SecretId: process.env.SECRET_MANAGER })
    );
    const secret = JSON.parse(secretResponse.SecretString);
    process.env.POSTGRES_USER=secret.POSTGRES_USER
    console.log("POSTGRES_USER")
    process.env.POSTGRES_PASSWORD=secret.POSTGRES_PASSWORD
    console.log("POSTGRES_PASSWORD")
    process.env.POSTGRES_DB=secret.POSTGRES_DB
    console.log("POSTGRES_DB")
    process.env.COGNITO_CLIENT_SECRET=secret.COGNITO_CLIENT_SECRET
    console.log("COGNITO_CLIENT_SECRET")
};
async function startApp() {
    await loadConfig();
    
    // Import routes
    const admin = require("./router/adminRoutes.js")
    const authRoutes= require('./router/authRoutes.js');
    const birdPostRoutes = require('./router/birdPostRoutes.js');
    const commentRoutes = require('./router/commentRoutes.js');

    // App
    const app = express();

    // Middleware
    app.use(express.urlencoded({extended:true}));
    app.use(express.json());

    // Routes
    app.use('/api/v0/admin', admin);
    app.use('/api/v0/auth', authRoutes);
    app.use('/api/v0/bird/posts', birdPostRoutes);
    app.use('/api/v0/bird/posts/:post_id/comments', commentRoutes);

    // Connect to DB

    app.listen(process.env.WEB_APP_PORT, () => console.log(`port:${process.env.WEB_APP_PORT}`));
}

startApp();