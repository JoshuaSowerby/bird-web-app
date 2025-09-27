require('dotenv').config();
const express = require('express');
SSM = require("@aws-sdk/client-ssm");
SecretsManager = require("@aws-sdk/client-secrets-manager");

const ssm = new SSM.SSMClient({ region: process.env.REGION });
const secretsManager = new SecretsManager({ region: process.env.REGION });

(async () =>{
    //load param store
    let param;
    //app
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/WEB_APP_PORT" }));
    process.env.WEB_APP_PORT=param.Parameter.Value;

    //rds
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/DB_HOST" }));
    process.env.DB_HOST=param.Parameter.Value;
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/DB_PORT" }));
    process.env.DB_PORT=param.Parameter.Value;

    //s3
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/BUCKET" }));
    process.env.BUCKET=param.Parameter.Value;
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/v" }));
    process.env.PURPOSE=param.Parameter.Value;
    //cognito
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/COGNITO_CLIENT_ID" }));
    process.env.COGNITO_CLIENT_ID=param.Parameter.Value;
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/COGNITO_USER_POOL_ID" }));
    process.env.COGNITO_USER_POOL_ID=param.Parameter.Value;
    //aws
    // /n11775556/QUT_USERNAME
    // param = await ssm.send(new GetParameterCommand({ Name: "/n11775556/BUCKET" }));
    // process.env.BUCKET=param.Parameter.Value;
    // /n11775556/REGION
    //sqs
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/SQS_URL" }));
    process.env.SQS_URL=param.Parameter.Value;
    //secret manager
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/SECRET_MANAGER" }));
    process.env.SECRET_MANAGER=param.Parameter.Value;
    //memcache
    param = await ssm.send(new SSM.GetParameterCommand({ Name: "/n11775556/MEM_CACHE_ADDRESS" }));
    process.env.MEM_CACHE_ADDRESS=param.Parameter.Value;

    //load secret manager
    const secretResponse = await secretsManager.getSecretValue({ SecretId: process.env.SECRET_MANAGER });
    const secret = JSON.parse(secretResponse.SecretString);
    process.env.POSTGRES_USER=secret.POSTGRES_USER
    process.env.POSTGRES_PASSWORD=secret.POSTGRES_PASSWORD
    process.env.POSTGRES_DB=secret.POSTGRES_DB
    process.env.COGNITO_CLIENT_SECRET=secret.COGNITO_CLIENT_SECRET
})();
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


app.listen(PORT, () => console.log(`port:${process.env.WEB_APP_PORT}`));