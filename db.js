//const mariadb = require('mariadb');
const {Pool} = require('pg');

const S3 = require("@aws-sdk/client-s3");

const s3Client = new S3.S3Client({ region: process.env.REGION });

( async () => {
    const createCmd = new S3.CreateBucketCommand({
        Bucket: process.env.BUCKET,
        Tagging: {
            TagSet:[
                {
                    Key:'qut-username',
                    Value: process.env.QUT_USERNAME
                },
                {
                    Key: 'purpose',
                    Value: process.env.PURPOSE
                }
            ]
        }
    });
    const taggingCmd = new S3.PutBucketTaggingCommand({
        Bucket: process.env.BUCKET,
        Tagging: {
            TagSet: [
                {
                    Key: 'qut-username',
                    Value: process.env.QUT_USERNAME,
                },
                {
                    Key: 'purpose',
                    Value: process.env.PURPOSE
                }
            ]
        }
    });
    try {
        console.log('creating s3')
        let response = await s3Client.send(createCmd);
        console.log(response);
        
    } catch (error) {
        console.log(error)
    }
    try {
        console.log('tagging s3')
        response = await s3Client.send(taggingCmd);
        console.log(response);
        console.log('done with s3')
    } catch (error) {
        console.log(error)
    }
    
})();

//TODO, get these from param and secret store
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'pass',
    database: process.env.POSTGRES_DB || 'birddb',
    ssl: { rejectUnauthorized: false }//AWS only, bad hardcoded FIX
    //connectionLimit: 5
});


// Init logic
( async () =>{
    let client;
    try{
        client = await pool.connect();
        console.log('connected');
        //tables
        const tables = [
            `/* users
            - need to properly verify emails etc.
            - also it should be the hash of the password
            */
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                -- public_id -- should add this, and then change jwt to use it instead,
                username VARCHAR(25) NOT NULL UNIQUE,
                sub VARCHAR(36) NOT NULL UNIQUE
                -- these are handled by cognito
                -- email VARCHAR(255) NOT NULL UNIQUE,
                -- pw_hash VARCHAR(60) NOT NULL
            );`,
            `/* posts
            - would be good if we allowed users to add suggested tags
              and allow others to vote on them so we can update the model later
            */
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                img_uuid VARCHAR(255) NOT NULL UNIQUE, 
                title VARCHAR(255) NOT NULL,
                /* votes INT DEFAULT 0, -- has its own table */
                ai_species VARCHAR(255),
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visibility VARCHAR(20) NOT NULL DEFAULT 'visible'
                    CHECK (visibility IN ('hidden', 'visible', 'friends_only')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`,
            `CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                post_id INT NOT NULL,
                parent_id INT NULL,
                text VARCHAR(255) NOT NULL,
                /* votes INT DEFAULT 0, -- has its own table */
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
            );`,
            `/* post_votes & comment_votes
            - vote should be from 3 options, +1, 0, -1.
            - If you haven't voted you have no table entry
            */
            CREATE TABLE IF NOT EXISTS post_votes (
                user_id INT NOT NULL,
                post_id INT NOT NULL,
                vote INT CHECK (vote in (-1, 0, 1)),
                PRIMARY KEY (user_id, post_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );`,
            `CREATE TABLE IF NOT EXISTS comment_votes (
                user_id INT NOT NULL,
                comment_id INT NOT NULL,
                vote INT CHECK (vote in (-1, 0, 1)),
                PRIMARY KEY (user_id, comment_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
            );`,
            `/*
            - later we should add friends so we can change post visibility 
            - also allow blocking users
            */`,
        ]

        await client.query('BEGIN');
        for (const table of tables){ await client.query(table)};
        await client.query('COMMIT')
    } catch (err) {
        console.error('DB init failed:',err.message);
    } finally {
        if (client){
            client.release();
            console.log('connection released');
        }
    }
})();

module.exports = {pool, s3Client};